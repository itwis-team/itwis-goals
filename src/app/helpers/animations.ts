import {animate, keyframes, style, transition, trigger} from '@angular/animations';

export const wave = trigger('wave', [
  transition('* => *', [
    animate(
      1500,
      keyframes([
        style({
          "background-position-x": "0",
          "top": "{{ top }}",
        }),
        style({
          "background-position-x": "-450px",
          "top": "{{ top }}",
        }),
      ])
    ),
  ], {params: {top: '0'}}),
]);
