import * as THREE from 'three';
import { createPropContext, finishPropModel } from '../shared/prop-kit.js';

export const LANTERN_PART_NAMES=Object.freeze(['lantern-base','lantern-frame','lantern-glass','lantern-roof','lantern-vent','lantern-handle']);
export function createLanternModel(transforms={},savedState={}) {
  const ctx=createPropContext('deck-lantern','Deck lantern',{length:.48,beam:.48,draft:.82});
  const {part,mesh,materials}=ctx;
  const base=part('lantern-base');
  mesh(base,new THREE.BoxGeometry(.42,.09,.42),materials.brass,'base-plate');
  const frame=part('lantern-frame');
  for(const x of [-.17,.17])for(const z of [-.17,.17]){
    const post=mesh(frame,new THREE.BoxGeometry(.035,.55,.035),materials.brass,'corner-post');
    post.position.set(x,.32,z);
  }
  const glass=part('lantern-glass');
  for(const [x,z] of [[0,.18],[0,-.18],[.18,0],[-.18,0]]){
    const pane=mesh(glass,new THREE.BoxGeometry(x===0?.31:.018,.46,z===0?.31:.018),materials.glass,'glass-pane');
    pane.position.set(x,.32,z);
  }
  const roof=part('lantern-roof');
  mesh(roof,new THREE.CylinderGeometry(.29,.2,.13,4),materials.trim,'sloped-roof').position.y=.64;
  const vent=part('lantern-vent');
  mesh(vent,new THREE.CylinderGeometry(.075,.09,.12,8),materials.iron,'vent-cap').position.y=.76;
  const handle=part('lantern-handle');
  const loop=mesh(handle,new THREE.TorusGeometry(.13,.018,8,20,Math.PI),materials.iron,'carry-loop');
  loop.rotation.z=Math.PI;
  loop.position.y=.86;
  return finishPropModel(ctx,'misc-prop-lantern',transforms,savedState);
}
