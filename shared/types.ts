export type Vec3 = [number, number, number];
export type CharacterId = 'homer'|'marge'|'bart'|'lisa'|'maggie';
export type Mode = 'manual'|'semi'|'auto';
export type Quality = 'low'|'medium'|'high';
export type CameraType = 'frontal'|'wide'|'reaction'|'first-person'|'environment'|'follow';
export interface Room {id:string;name:string;floor:number;origin:Vec3;size:[number,number];color:string;kind:string;neighbors:string[]}
export interface CameraPreset {id:string;name:string;room:string;position:Vec3;target:Vec3;fov:number;type:CameraType;transition:'cut'|'smooth'|'fade'}
export interface CharacterState {id:CharacterId;name:string;enabled:boolean;expression:'neutral'|'happy'|'confused'|'angry'|'sleepy';activity:'idle'|'talking'|'sitting'|'walking'|'sleeping'|'reacting';room:string;volume:number}
export interface Speech {id:string;character:CharacterId;text:string;priority:number;createdAt:number;duration:number;effect?:string;replyTo?:ChatMessage}
export interface ChatMessage {id:string;user:string;text:string;at:number;selected:boolean;source:'test'|'local'|'tiktok';avatarUrl?:string;priority?:number}
export interface EventLog {id:string;at:number;type:string;message:string}
export interface Line {id:string;character:CharacterId;category:string;text:string}
export interface EventDefinition {id:string;name:string;probability:number;cooldown:number;priority:number;duration:number;enabled:boolean;lastRun:number}
export interface Settings {mode:Mode;autoCamera:boolean;aiEnabled:boolean;familyEnabled:boolean;eventsEnabled:boolean;quality:Quality;adaptiveQuality:boolean;masterVolume:number;effectsVolume:number;familyMin:number;familyMax:number;responseCooldown:number;cameraInterval:number;timeMode:'real'|'accelerated'|'fixed';timeScale:number;retentionDays:number;cleanOverlay:boolean;provider:'demo'|'openai-compatible';ttsProvider:'browser'|'openai-compatible'|'silent'}
export interface GameState {id:string;type:'hangman'|'quiz'|'guess'|'poll'|'challenge';title:string;hint:string;masked:string;options:string[];guesses:string[];attempts:number;maxAttempts:number;score:number;endsAt:number;status:'playing'|'won'|'lost'|'ended';result?:string;votes:Record<string,number>}
export interface Movement {from:string;to:string;path:Vec3[];startedAt:number;duration:number}
export interface LiveState {irl?:{enabled:boolean;startedAt:number;pendingDonuts:number;stopIndex?:number;plan?:import('./irl').IRLPlan};version:number;layoutRevision?:number;startedAt:number;paused:boolean;settings:Settings;characters:Record<CharacterId,CharacterState>;homer:{mood:number;energy:number;hunger:number;sleep:number;attention:number;interest:number;lastFamily:number};room:string;cameraId:string;cameras:CameraPreset[];speaking:Speech|null;speechQueue:Speech[];chat:ChatMessage[];logs:EventLog[];events:EventDefinition[];lines:Line[];game:GameState|null;movement:Movement|null;interaction?:{id:string;kind:'donut';startedAt:number;duration:number};virtualHour:number;weather:'clear'|'rain';power:boolean;tvChannel:number;doors:Record<string,boolean>;memory:string[];proposals:Array<{id:string;action:Action;reason:string;replyTo?:ChatMessage}>;providers:{ai:string;tts:string};nextFamilyAt:number}
export type Action =
 | {type:"IRL";enabled:boolean}
 | {type:'TALK';character:CharacterId;text:string;priority?:number}
 | {type:'REACT';character:CharacterId;expression:CharacterState['expression']}
 | {type:'CHANGE_CAMERA';cameraId:string}
 | {type:'MOVE_TO_ROOM';room:string}
 | {type:'START_GAME';game:GameState['type']}
 | {type:'STOP_GAME'}
 | {type:'PLAY_ANIMATION';character:CharacterId;activity:CharacterState['activity']}
 | {type:'INTERACT_WITH_OBJECT';object:string}
 | {type:'RESPOND_TO_FAMILY';character:CharacterId}
 | {type:'PAUSE';paused:boolean}
 | {type:'SETTINGS';settings:Partial<Settings>}
 | {type:'CHARACTER';character:CharacterId;patch:Partial<Pick<CharacterState,'enabled'|'volume'|'expression'>>}
 | {type:'TRIGGER_EVENT';eventId:string}
 | {type:'UPDATE_EVENT';eventId:string;patch:Partial<Pick<EventDefinition,'enabled'|'probability'|'cooldown'|'duration'|'priority'>>}
 | {type:'ADD_CAMERA';camera:CameraPreset}
 | {type:'ADD_LINE';line:Line}
 | {type:'CHAT';user:string;text:string;source?:'test'|'local'|'tiktok';avatarUrl?:string}
 | {type:'SELECT_CHAT';messageId:string}
 | {type:'GAME_INPUT';value:string;user?:string}
 | {type:'APPROVE_PROPOSAL';id:string}
 | {type:'SET_TIME';hour:number}
 | {type:'CLEAR_MEMORY'};
