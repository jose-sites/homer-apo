/** Visual-only palette. Room IDs, world coordinates and navigation stay in shared/data. */
export interface RoomLook { wall:string; trim:string; floor:string[]; accent:string }
export const ROOM_LOOKS:Record<string,RoomLook>={
 living:{wall:'#ed78a0',trim:'#ffd1ac',floor:['#e79a49','#efa653','#dc883c'],accent:'#913caa'},
 kitchen:{wall:'#f1b353',trim:'#ffda8a',floor:['#996ac3','#fff2d4'],accent:'#8550b9'},
 dining:{wall:'#e97b97',trim:'#ffd39d',floor:['#e6a453','#edb363','#d99042'],accent:'#198e92'},
 hall:{wall:'#ed819b',trim:'#ffd2a3',floor:['#d79043','#e4a555'],accent:'#784091'},
 wc:{wall:'#70cfcb',trim:'#e5fff3',floor:['#45aba9','#f2eedb'],accent:'#9c65c2'},
 garage:{wall:'#9f9e85',trim:'#645b49',floor:['#9c9990','#a8a399'],accent:'#d9579e'},
 front:{wall:'#edba72',trim:'#fdcf94',floor:['#74b43c','#7abc42'],accent:'#d36b49'},
 yard:{wall:'#79b749',trim:'#e6bd66',floor:['#76b83e','#7abe42'],accent:'#59b5a0'},
 upstairs:{wall:'#e96d9d',trim:'#ffd19c',floor:['#e2a04e','#edb564'],accent:'#8d409b'},
 parents:{wall:'#e87b91',trim:'#ffc6a6',floor:['#e7a353','#edaf61'],accent:'#8b3fa7'},
 bart:{wall:'#269ec1',trim:'#79d0dc',floor:['#228e74','#29977c'],accent:'#e94336'},
 lisa:{wall:'#f39890',trim:'#ffd5a9',floor:['#e8a44f','#efb566'],accent:'#a847b8'},
 maggie:{wall:'#f4a5ad',trim:'#ffdbad',floor:['#e3a659','#efb669'],accent:'#519edd'},
 bathroom:{wall:'#56b4cb',trim:'#c7edf0',floor:['#3299ae','#f2f0df'],accent:'#a27bce'},
 basement:{wall:'#858c81',trim:'#6e6048',floor:['#969581','#a29e88'],accent:'#399b88'},
 attic:{wall:'#b37c48',trim:'#6c422c',floor:['#b1814c','#bc8a53','#a67440'],accent:'#88509b'},
};
export const roomLook=(id:string)=>ROOM_LOOKS[id]||ROOM_LOOKS.living;
