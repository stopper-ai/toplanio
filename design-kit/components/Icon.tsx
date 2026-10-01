import * as React from 'react';
export function Icon({name,size=20,label,assetBase='/toplanio/assets'}:{name:string;size?:number;label?:string;assetBase?:string}){
 return <svg className="icon" style={{width:size,height:size}} role={label?'img':undefined} aria-label={label} aria-hidden={label?undefined:true}><use href={`${assetBase}/icons/sprite.svg#${name}`}/></svg>;
}
// Icon-only action: <button className="btn icon-button" aria-label="Bildirimler"><Icon name="bell"/></button>
