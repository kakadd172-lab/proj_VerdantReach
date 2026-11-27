import * as THREE from 'three';
import { createPropContext, finishPropModel } from '../shared/prop-kit.js';

export const CRATE_PART_NAMES=Object.freeze(['crate-core','front-planks','rear-planks','port-planks','starboard-planks','top-planks','corner-braces','iron-fasteners']);
export function createCrateModel(transforms={},savedState={}) {
  const ctx=createPropContext('cargo-crate','Cargo crate',{length:.95,beam:.82,draft:.82});
  const {part,mesh,materials}=ctx;
  const core=part('crate-core');
  mesh(core,new THREE.BoxGeometry(.82,.82,.82),materials.lower,'inner-box');
  for(const [name,axis,sign] of [['front-planks','z',1],['rear-planks','z',-1],['port-planks','x',-1],['starboard-planks','x',1]]){
    const group=part(name);
    for(let i=0;i<5;i++){
      const plank=mesh(group,new THREE.BoxGeometry(axis==='x'?.82:.16,.15,.035),materials.plank,'board-'+i);
      plank.position.y=-.32+i*.16;
      if(axis==='z')plank.position.z=sign*.425;
      else {plank.rotation.y=Math.PI/2;plank.position.x=sign*.425;}
    }
  }
  const top=part('top-planks');
  for(let i=0;i<5;i++){
    const board=mesh(top,new THREE.BoxGeometry(.82,.035,.15),materials.deck,'lid-board-'+i);
    board.position.z=-.32+i*.16;board.position.y=.425;
  }
  const braces=part('corner-braces');
  for(const x of [-.39,.39])for(const z of [-.39,.39]){
    const brace=mesh(braces,new THREE.BoxGeometry(.055,.88,.055),materials.trim,'corner-post');
    brace.position.set(x,0,z);
  }
  const fasteners=part('iron-fasteners');
  for(const x of [-.3,.3])for(const z of [-.45,.45])for(const y of [-.3,.3]){
    const nail=mesh(fasteners,new THREE.SphereGeometry(.018,8,6),materials.iron,'nail');
    nail.position.set(x,y,z);
  }
  return finishPropModel(ctx,'misc-prop-crate',transforms,savedState);
}
