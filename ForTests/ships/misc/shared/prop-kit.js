import { createShipContext, finishShipModel, disposeShipModel } from '../../shared/ship-editor-kit.js';

export function createPropContext(id,label,dimensions={length:1.2,beam:1.2,draft:.8}) {
  const design={
    id, label,
    hullLength:dimensions.length, beam:dimensions.beam, draft:dimensions.draft,
    hullLengthUnits:dimensions.length*1.333, beamUnits:dimensions.beam*1.333,
    draftUnits:dimensions.draft*1.333, deckHeightUnits:dimensions.draft*1.333,
    lengthBeamRatio:dimensions.length/Math.max(.01,dimensions.beam),
    rig:'Standalone maritime prop', era:'Age of Sail',
    hullProfile:'Independent editable maritime prop',
    reference:'Original Verdant Reach miscellaneous asset',
    sources:[], masts:[], partNames:[]
  };
  const vessel={
    design, structure:{frameCount:1},
    editorModulePath:'ForTests/ships/misc/',
    gameDefinitionPath:'src/world/props/misc/',
    editorDefaults:{componentState:{}}
  };
  return createShipContext(vessel,{
    hull:0x765238,lower:0x3d3026,plank:0x9a7048,deck:0xb18a5b,
    trim:0x493629,iron:0x454b4a,brass:0x967447,glass:0x8fb9b1
  });
}

export function finishPropModel(ctx,id,transforms={},savedState={}) {
  const root=finishShipModel(ctx,transforms,savedState);
  root.name='Verdant Reach · '+ctx.design.label;
  root.userData.shipType='misc-prop';
  root.userData.miscModelId=id;
  root.userData.miscModelType=id==='misc-prop-bollard'?'fitting':id.replace('misc-prop-','');
  root.userData.modelCategory='miscellaneous';
  root.userData.propNonFunctional=true;
  root.userData.partNames=[...ctx.registry.keys()];
  root.userData.dispose=()=>disposeShipModel(root);
  return root;
}
