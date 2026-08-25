(function(root){
  'use strict';
  const AUDIO_MIX=Object.freeze({
    private:0.42,
    synthetic:0.31,
    ducked:0.14,
    handoff:0.29
  });
  if(typeof module!=='undefined'&&module.exports)module.exports={AUDIO_MIX};
  root.ORBITAudioMix=AUDIO_MIX;
})(typeof window!=='undefined'?window:globalThis);
