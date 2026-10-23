export interface AudioJob {id:string;priority:number;run:(signal:AbortSignal)=>Promise<void>}
/** Sequential playback. High priority reorders pending jobs, never interrupts active dialogue. */
export class AudioQueue {
 private pending:AudioJob[]=[];private active:AbortController|null=null;private seen=new Set<string>();private generation=0;
 onError:(error:unknown)=>void=()=>{};
 get size(){return this.pending.length+(this.active?1:0)}
 enqueue(job:AudioJob){if(this.seen.has(job.id))return;this.seen.add(job.id);if(this.seen.size>500)this.seen.delete(this.seen.values().next().value!);this.pending.push(job);this.pending.sort((a,b)=>b.priority-a.priority);if(this.pending.length>12)this.pending.pop();void this.drain()}
 clear(){this.generation++;this.pending=[];this.active?.abort();this.active=null;this.seen.clear()}
 private async drain(){if(this.active)return;const job=this.pending.shift();if(!job)return;const generation=this.generation;const controller=new AbortController();this.active=controller;try{await job.run(controller.signal)}catch(error){if(!controller.signal.aborted)this.onError(error)}finally{if(generation===this.generation){this.active=null;void this.drain()}}}
}
