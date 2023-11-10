import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
  Renderer2,
} from '@angular/core';
import { SwiperOptions, Swiper } from 'swiper';
import { GoalItem } from '../../types/GoalItem';
import { allItems, currentAmount } from '../../data/data';
import { wave } from '../../helpers/animations';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  animations: [wave],
})
export class MainComponent implements OnInit, AfterViewInit {
  @ViewChild('cursor') cursor!: ElementRef;
  @ViewChild('swiper', { static: false }) swiperElement!: any;

  preparedItems!: GoalItem[];
  current: number = currentAmount;
  currentAmount = currentAmount;
  allItems: GoalItem[] = allItems;
  swiper!: Swiper;
  card!: ElementRef;

  runAnimation: boolean = true;

  // ! Параметры Swiper
  config: SwiperOptions = {
    slidesPerView: 1,
    spaceBetween: 0,
    centeredSlides: true,
    breakpoints: {
      '2400': {
        slidesPerView: 1,
        spaceBetween: 0,
      },
      '2000': {
        slidesPerView: 1,
        spaceBetween: 0,
      },
      '1600': {
        slidesPerView: 1,
        spaceBetween: 0,
      },
      '1200': {
        slidesPerView: 1,
        spaceBetween: 0,
      },
      '800': {
        slidesPerView: 1,
        spaceBetween: 0,
      },
      '750': {
        slidesPerView: 1,
        spaceBetween: 0,
      },
      '600': {
        slidesPerView: 1,
      },
      '430': {
        slidesPerView: 1,
      },
    },
    navigation: {
      prevEl: '.swiper__slider-prev',
      nextEl: '.swiper__slider-next',
    },
  };

  constructor(private cdr: ChangeDetectorRef, private renderer: Renderer2) {}

  ngOnInit(): void {
    this.preparedItems = allItems.map((item) => {
      if (item.goal <= this.current) {
        item.complete = true;
      }

      if (item.prevGoal <= this.current && this.current < item.goal) {
        item.current = true;
        /* item.percent = this.getWavePercent(item); */
      }

      return item;
    });
  }

  ngAfterViewInit() {
    // ! Инициализировать Swiper после отображения представления
    this.initializeSwiper();

    /* // ! Поиск карточки на странице
    this.card = this.renderer.selectRootElement('.card__wrapper');
    this.mouseMoveHandler = this.mouseMoveHandler.bind(this);

    // ! Переделанный обработчик события мыши для перемещения .card
    this.renderer.listen(window, 'mousemove', (event: MouseEvent) => {
      this.mouseMoveHandler(event);
    }); */
  }

  // ! Выбрать цвет фона из data.ts
  getBackgroundColor(index: number): string {
    if (this.allItems[index]) {
      return this.allItems[index].bgcolor || 'rgba(242, 242, 242, 1)'; // Цвет по умолчанию
    }
    return 'rgba(242, 242, 242, 1)';
  }

  // ! Выявить номер слайда и изменить цвет фона
  initializeSwiper() {
    if (this.swiperElement && this.swiperElement.swiper) {
      this.swiper = this.swiperElement.swiper;

      // ! Подписка на событие изменения слайда в Swiper
      this.swiper.on('slideChange', () => {
        // ! Обновление цвета фона
        this.updateContainerBackgroundColor();
        // ! Принудительное обновление Angular Change Detection
        this.cdr.detectChanges();
      });
    }
  }

  // ! Изменить цвет фона, учитвая номер слайда
  updateContainerBackgroundColor() {
    const activeSlideIndex = this.swiper.activeIndex;
    if (this.allItems[activeSlideIndex]) {
      const bgColor = this.allItems[activeSlideIndex].bgcolor;
      const container = document.querySelector('.container');
      if (container) {
        this.renderer.setStyle(container, 'background-color', bgColor);
      }
    }
  }

  /* @HostListener('document:mousemove', ['$event'])
  onMouseMove(e: any) {
    let pos = {
      x: e.pageX,
      y: e.pageY,
    };

    this.cursor.nativeElement.style.left = pos.x - 60 + 'px';
    this.cursor.nativeElement.style.top = pos.y - 60 + 'px';
  } */

  // ! Листание свайпера
  @HostListener('document:wheel', ['$event'])
  onScroll(e: any) {
    e.wheelDeltaY < 0
      ? this.swiperElement.swiper.slideNext()
      : this.swiperElement.swiper.slidePrev();
  }

  /* getWavePercent(item: GoalItem) {
    //lower pos
    if (this.getCurrentPercent(item) <= 15) {
      return 5;
    }

    //higher pos
    if (this.getCurrentPercent(item) >= 95) {
      return 85;
    }

    return this.getCurrentPercent(item);
  } */

  /*  getCurrentPercent(item: GoalItem) {
    return (this.current / item.goal) * 100;
  } */

  shouldShowElement: boolean = true;

  // ! Посчитать текущий результат от общей цели в процентах
  calculatePercentage(item: GoalItem): any {
    let percent = (currentAmount / item.goal) * 100;
    // ! Если больше 100, сани не уедут за правый край
    if (percent > 100) {
      percent = 100;
    }
    return percent;
  }

  /*  mouseMoveHandler(event: MouseEvent): void {
    // ! Изменение стилей элемента .card при перемещении мыши
    this.renderer.setStyle(this.card.nativeElement, 'left', `${event.pageX}px`);
    this.renderer.setStyle(this.card.nativeElement, 'top', `${event.pageY}px`);
  } */
}
