/** Visual legend only. No gift receiver, action dispatch or end-stream command. */
export const GIFT_LEGEND=[
 {id:'rose',name:'Rosa (Rose)',image:'rose.png',label:'ME RESPONDA PRIMEIRO'},
 {id:'dino',name:'Dino (Tiny Diny)',image:'tiny-diny.png',label:'ME DÁ UM SALVE'},
 {id:'doughnut',name:'Rosquinha (Doughnut)',image:'doughnut.png',label:'HOMER COME UMA ROSQUINHA'},
 {id:'heart',name:'Coração com as mãos (Hand Heart, 100 moedas)',image:'hand-heart.png',label:'A LIVE ACABA'},
] as const;
export function GiftColumn(){return <aside className="gift-column" aria-label="Legenda visual dos presentes — integração desativada">{GIFT_LEGEND.map(gift=><div className="gift-legend-item" key={gift.id}><img src={`${import.meta.env.BASE_URL}gifts/${gift.image}`} alt={gift.name} draggable={false}/><strong>{gift.label}</strong></div>)}</aside>}
