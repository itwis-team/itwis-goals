import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
  Renderer2,
  OnDestroy,
  ViewChildren,
  QueryList,
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
  @ViewChild('cardWrapper') cardWrapper!: ElementRef;
  @ViewChildren('card') cards: QueryList<ElementRef> | undefined;

  preparedItems!: GoalItem[];
  current: number = currentAmount;
  currentAmount = currentAmount;
  allItems: GoalItem[] = allItems;
  swiper!: Swiper;
  private card: HTMLElement | null = null;
  private mouseX = 0;
  private mouseY = 0;
  private isCardMoving = false;

  runAnimation: boolean = true;

  // ! Параметры Swiper
  config: SwiperOptions = {
    slidesPerView: 1,
    spaceBetween: 0,
    centeredSlides: true,
    /* breakpoints: {
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
    }, */
    navigation: {
      prevEl: '.slider-prev',
      nextEl: '.slider-next',
    },
  };

  constructor(
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2,
    private elRef: ElementRef
  ) {}

  ngOnDestroy() {
    // ! Отписываемся от события transitionEnd при уничтожении компонента
    this.swiperElement.swiper.off('transitionEnd', this.handleTransitionEnd);
  }

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

    // ! Вторая версия перемещения карточки
    this.card = this.elRef.nativeElement.querySelector('.card');

    // ! Подписываемся на событие mousemove через Renderer2
    this.renderer.listen(
      this.elRef.nativeElement,
      'mousemove',
      (e: MouseEvent) => {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;

        if (!this.isCardMoving) {
          this.moveCardSmoothly();
        }
      }
    );

    // ! Повторно инициализировать анимацию карточки при отображении
    this.initializeCardAnimation();
  }

  // ! Обработчик завершения анимации перехода слайда
  private handleTransitionEnd = () => {
    this.card = null;
    this.cards?.forEach((card, index) => {
      if (index === this.swiper.activeIndex) {
        this.card = card.nativeElement;
      }
    });
  };

  // ! Логика анимации карточки
  private moveCardSmoothly() {
    if (this.card) {
      this.isCardMoving = true;
      const animationDuration = 3000; // Продолжительность анимации в миллисекундах
      const startTime = performance.now();
      const initialLeft = parseInt(getComputedStyle(this.card).left) || 0;
      const initialTop = parseInt(getComputedStyle(this.card).top) || 0;
      const initialSkewX =
        parseInt(getComputedStyle(this.card).transform.split('(')[1]) || 0;
      const initialSkewY =
        parseInt(getComputedStyle(this.card).transform.split(',')[1]) || 0;
      const initialScaleX =
        parseInt(getComputedStyle(this.card).transform.split('(')[1]) || 0;
      const initialScaleY =
        parseInt(getComputedStyle(this.card).transform.split(',')[1]) || 0;
      const initialScaleZ =
        parseInt(getComputedStyle(this.card).transform.split(',')[1]) || 0;

      const moveFrame = (timestamp: number) => {
        const progress = Math.min(
          1,
          (timestamp - startTime) / animationDuration
        );

        this.card!.style.left =
          initialLeft + progress * (this.mouseX - initialLeft) + 'px';
        this.card!.style.top =
          initialTop + progress * (this.mouseY - initialTop) + 'px';
        this.card!.style.transform = `skew(${initialSkewX + progress * 5}deg, ${
          initialSkewY + progress * 5
        }deg)`;
        this.card!.style.transform = `scale(${
          initialScaleX + progress * 5
        }deg, ${initialScaleY + progress * 5}deg, ${
          initialScaleZ + progress * 5
        }deg)`;

        if (progress < 1) {
          requestAnimationFrame(moveFrame);
        } else {
          this.isCardMoving = false;
        }
      };

      requestAnimationFrame(moveFrame);
    }
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

      this.swiper.on('slideChangeTransitionEnd', () => {
        this.updateContainerBackgroundColor();

        this.cdr.detectChanges();

        this.initializeCardAnimation();
      });
    }
  }

  // !Инициализировать переменную card после отображения представления
  initializeCardAnimation() {
    this.cards?.forEach((card, index) => {
      if (index === this.swiper.activeIndex) {
        this.card = card.nativeElement;
      }
    });
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

  // ! Листание свайпера
  @HostListener('document:wheel', ['$event'])
  onScroll(e: any) {
    e.wheelDeltaY < 0
      ? this.swiperElement.swiper.slideNext()
      : this.swiperElement.swiper.slidePrev();
  }

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
}
