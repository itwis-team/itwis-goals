import {animate, keyframes, style, transition, trigger} from '@angular/animations';

export const wave = trigger('wave', [
  transition('* => *', [
    animate(
      3000,
      keyframes([
        style({"background-position-x": 0}),
        style({
          "background-position-x": "-500px"
        }),
      ])
    ),
  ]),
]);
