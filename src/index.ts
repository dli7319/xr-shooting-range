import * as xb from 'xrblocks';
import { ShootingGame } from './ShootingGame';

document.addEventListener('DOMContentLoaded', () => {
  const options = new xb.Options();
  options.enableHands();
  options.enableReticles();
  options.controllers.visualizeRays = true;

  xb.add(new ShootingGame());
  xb.init(options);
});
