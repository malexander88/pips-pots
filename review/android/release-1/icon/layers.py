# Build the Android icon resources and the masked previews from the two painted layers.
import numpy as np, os
from PIL import Image, ImageDraw, ImageFilter
RES='/workspace/ss6/android-rel1/app/src/main/res'
bg=Image.open('_raw/layer_bg.png').convert('RGBA'); fg=Image.open('_raw/layer_fg.png').convert('RGBA')
M=bg.size[0]  # 1080 = 108 dp
# monochrome: outlines solid, fills light (the launcher tints by alpha)
a=np.asarray(fg).astype(np.float32)/255
luma=0.2126*a[...,0]+0.7152*a[...,1]+0.0722*a[...,2]
k=np.clip((luma-0.38)/(0.55-0.38),0,1)          # 0 = dark line, 1 = fill
alpha=a[...,3]*(1-k*0.62)
mono=np.zeros_like(a); mono[...,:3]=1; mono[...,3]=alpha
mono=Image.fromarray((mono*255+0.5).astype(np.uint8),'RGBA')
mono.save('_raw/layer_mono.png')
flat=Image.alpha_composite(bg,fg)
dens={'mdpi':1,'hdpi':1.5,'xhdpi':2,'xxhdpi':3,'xxxhdpi':4}
def mask(shape,n):
    s=4; N=n*s; m=Image.new('L',(N,N),0); d=ImageDraw.Draw(m)
    if shape=='circle': d.ellipse((0,0,N-1,N-1),fill=255)
    elif shape=='rounded': d.rounded_rectangle((0,0,N-1,N-1),radius=int(N*0.2),fill=255)
    elif shape=='square': d.rectangle((0,0,N-1,N-1),fill=255)
    elif shape=='teardrop':
        d.ellipse((0,0,N-1,N-1),fill=255); d.rectangle((N//2,N//2,N-1,N-1),fill=255)
    elif shape=='squircle':
        y,x=np.mgrid[0:N,0:N]; u=(x+0.5)/N*2-1; v=(y+0.5)/N*2-1
        m=Image.fromarray(((np.abs(u)**5+np.abs(v)**5)<=1).astype(np.uint8)*255,'L')
    return m.resize((n,n),Image.LANCZOS)
def visible(img):  # the launcher shows the middle 72 of 108 dp
    c=M/6; return img.crop((int(c),int(c),int(M-c),int(M-c)))
def shaped(img,shape,n):
    v=visible(img).resize((n,n),Image.LANCZOS); out=Image.new('RGBA',(n,n),(0,0,0,0)); out.paste(v,(0,0),mask(shape,n)); return out
for d,f in dens.items():
    L=round(108*f); ic=round(48*f)
    dr=f'{RES}/mipmap-{d}'; os.makedirs(dr,exist_ok=True)
    bg.resize((L,L),Image.LANCZOS).convert('RGB').save(f'{dr}/ic_launcher_background.png',optimize=True)
    fg.resize((L,L),Image.LANCZOS).save(f'{dr}/ic_launcher_foreground.png',optimize=True)
    mono.resize((L,L),Image.LANCZOS).save(f'{dr}/ic_launcher_monochrome.png',optimize=True)
    # legacy (Android 7.x and older launchers): full art, rounded square and circle
    shaped(flat,'rounded',ic).save(f'{dr}/ic_launcher.png',optimize=True)
    shaped(flat,'circle',ic).save(f'{dr}/ic_launcher_round.png',optimize=True)
# ---- previews ----
P=300; pad=40; shapes=['circle','squircle','rounded','teardrop','square']
labels=['Circle (Pixel)','Squircle (Samsung One UI)','Rounded square','Teardrop','Square (full 72 dp)']
from PIL import ImageFont
try: font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',22); small=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
except Exception: font=small=ImageFont.load_default()
def sheet(items,title,bgc=(244,248,255)):
    W=len(items)*(P+pad)+pad; H=P+150
    s=Image.new('RGB',(W,H),bgc); d=ImageDraw.Draw(s); d.text((pad,18),title,fill=(46,65,104),font=font)
    for i,(im,lab) in enumerate(items):
        x=pad+i*(P+pad); y=70; s.paste(im,(x,y),im); d.text((x,y+P+14),lab,fill=(46,65,104),font=small)
    return s
os.makedirs('previews',exist_ok=True)
sh1=sheet([(shaped(flat,sp,P),lb) for sp,lb in zip(shapes,labels)],"Pip's Pots 1.0.2 launcher icon: adaptive icon under each launcher mask")
sh1.save('previews/masks.png')
# themed (Android 13+): launcher tints the monochrome layer; light and dark examples
def themed(fgc,bgc,shape='circle'):
    v=visible(mono).resize((P,P),Image.LANCZOS); a=np.asarray(v)[...,3]
    t=Image.new('RGBA',(P,P),bgc+(255,)); col=Image.new('RGBA',(P,P),fgc+(255,)); t.paste(col,(0,0),Image.fromarray(a,'L'))
    out=Image.new('RGBA',(P,P),(0,0,0,0)); out.paste(t,(0,0),mask(shape,P)); return out
sh2=sheet([(themed((32,74,135),(214,227,255)),'Themed, light (circle)'),(themed((214,227,255),(32,46,70)),'Themed, dark (circle)'),
           (themed((60,90,40),(220,236,200),'squircle'),'Themed, green (squircle)'),
           (shaped(flat,'rounded',P),'Legacy ic_launcher'),(shaped(flat,'circle',P),'Legacy ic_launcher_round')],
          "Themed (monochrome) icon and the legacy icons")
sh2.save('previews/themed_and_legacy.png')
# safe zone overlay on the full 108 dp layers
o=flat.resize((540,540),Image.LANCZOS).convert('RGBA'); d=ImageDraw.Draw(o)
c=270; r66=270*66/108; r72=270*72/108
d.ellipse((c-r66,c-r66,c+r66,c+r66),outline=(255,0,128,255),width=3)
d.rectangle((c-r72,c-r72,c+r72,c+r72),outline=(0,0,0,200),width=2)
d.ellipse((c-r72,c-r72,c+r72,c+r72),outline=(0,0,0,120),width=1)
o.save('previews/safe_zone.png')
# home screen mock: the icon among plain squares at real size (xxhdpi 48 dp = 144 px)
hs=Image.new('RGB',(4*200+40,260),(40,62,98)); d=ImageDraw.Draw(hs)
for i,sp in enumerate(['circle','squircle','rounded','teardrop']):
    im=shaped(flat,sp,144); hs.paste(im,(40+i*200+8,40),im); d.text((40+i*200+20,200),"Pip's Pots",fill=(255,255,255),font=small)
hs.save('previews/home_size.png')
both=Image.new('RGB',(max(sh1.width,sh2.width),sh1.height+sh2.height),(244,248,255)); both.paste(sh1,(0,0)); both.paste(sh2,(0,sh1.height)); both.save('previews/icon_previews.png')
print('ok')
