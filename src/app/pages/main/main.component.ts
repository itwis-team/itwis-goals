import {Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {SwiperOptions} from "swiper";
import {GoalItem} from "../../types/GoalItem";
import {allItems, currentAmount} from "../../data/data";
import {wave} from "../../helpers/animations";

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  animations: [wave]
})
export class MainComponent implements OnInit {

  @ViewChild('cursor') cursor!: ElementRef
  @ViewChild('swiper', {static: false}) swiperElement!: any;

  preparedItems!: GoalItem[];
  current: number = currentAmount

  runAnimation: boolean = true;

  config: SwiperOptions = {
    slidesPerView: 4,
    spaceBetween: 25,
    centeredSlides: true,
  }

  constructor() {
  }

  ngOnInit(): void {
    this.preparedItems = allItems.map(item => {
      if (item.goal <= this.current) {
        item.complete = true
      }

      if (item.prevGoal <= this.current && this.current < item.goal) {
        item.current = true
      }

      return item;
    })
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: any) {
    let pos = {
      x: e.pageX,
      y: e.pageY
    };

    this.cursor.nativeElement.style.left = pos.x - 60 + 'px'
    this.cursor.nativeElement.style.top = pos.y - 60 + 'px'
  }

  @HostListener('document:wheel', ['$event'])
  onScroll(e: any) {
    e.wheelDeltaY < 0
      ? this.swiperElement.swiper.slideNext()
      : this.swiperElement.swiper.slidePrev();
  }
}
