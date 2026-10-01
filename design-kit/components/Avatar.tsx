import * as React from 'react';
export function fallbackAvatarId(stableId: string): string {
  let hash = 2166136261;
  for (let i=0;i<stableId.length;i++) hash=Math.imul(hash ^ stableId.charCodeAt(i),16777619)>>>0;
  return `avatar-${String(hash % 25 + 1).padStart(2,'0')}`;
}
export function Avatar({stableId, name, photoUrl, avatarId, size=40, assetBase='/toplanio/assets', decorative=false}: {
  stableId:string; name:string; photoUrl?:string; avatarId?:string; size?:number; assetBase?:string; decorative?:boolean;
}) {
  const [failedUrl,setFailedUrl]=React.useState<string>();
  const id=avatarId && /^avatar-(0[1-9]|1[0-9]|2[0-5])$/.test(avatarId) ? avatarId : fallbackAvatarId(stableId);
  const photo=photoUrl && photoUrl!==failedUrl;
  const src=photo ? photoUrl : `${assetBase}/avatars/128/${id}.png`;
  return <img src={src} width={size} height={size} alt={decorative?'':`${name} profil görseli`} className={`avatar ${photo?'':'avatar-pixel'}`} loading="lazy" decoding="async" onError={()=>{if(photoUrl && photo) setFailedUrl(photoUrl)}}/>;
}
