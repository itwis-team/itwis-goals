import {Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {SwiperOptions} from "swiper";

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  @ViewChild('cursor') cursor!: ElementRef

  config: SwiperOptions = {
    slidesPerView: 2.5,
    spaceBetween: 25,
    centeredSlides: true,
  }

  constructor() {
  }

  ngOnInit(): void {
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: any) {
    if (!e) return;

    let pos = {
      x: e.pageX,
      y: e.pageY
    };
    this.cursor.nativeElement.style.left = pos.x - 60 + 'px'
    this.cursor.nativeElement.style.top = pos.y - 60 + 'px'
  }
}
