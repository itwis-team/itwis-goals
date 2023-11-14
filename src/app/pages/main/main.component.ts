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
import * as THREE from 'three';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
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
    this.subscribeToSlideChange();

    /*  const cardElement = this.cardWrapper.nativeElement.querySelector('.card'); */

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

    // ! Новая анимация карточки через Three.js

    this.card = this.elRef.nativeElement.querySelector('.card');

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    camera.position.z = Math.round(10000 / 20);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    this.elRef.nativeElement.appendChild(renderer.domElement);

    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    document.addEventListener('mousemove', (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 10 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 10 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children);

      if (intersects.length > 0) {
        const obj = intersects[0].object;
        if (obj && this.card) {
          this.renderer.setStyle(
            this.card,
            'transform',
            `translate(${mouse.x * 100}px, ${mouse.y * 100}px)`
          );
        }
      }
    });

    const render = () => {
      requestAnimationFrame(render);
      renderer.render(scene, camera);
    };
    render();

    // ! Повторно инициализировать анимацию карточки при отображении

    /* this.initializeCardAnimation() */
    this.subscribeToSlideChange();
  }

  // ! Обноавление методов при смене слайда
  private subscribeToSlideChange() {
    if (this.swiperElement && this.swiperElement.swiper) {
      this.swiper = this.swiperElement.swiper;
      const activeSlideIndex = this.swiper.activeIndex;

      this.swiper.on('slideChangeTransitionEnd', () => {
        this.updateContainerBackgroundColor();
        this.cdr.detectChanges();
        this.moveCardOnCurrentSlide(activeSlideIndex);
        this.initializeCardAnimation();
      });
    }
  }

  // ! Движение карточки при смене слайда
  private moveCardOnCurrentSlide(activeSlideIndex: number) {
    const cardsArray = this.cards?.toArray();
    const cardOfCurrentSlide = cardsArray
      ? cardsArray[activeSlideIndex]?.nativeElement
      : null;

    if (cardOfCurrentSlide && !this.isCardMoving) {
      this.card = cardOfCurrentSlide;
      this.moveCardSmoothly();
    }
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
      const animationDuration = 4000;
      const startTime = performance.now();
      const initialLeft = parseInt(getComputedStyle(this.card).left) || 0;
      const initialTop = parseInt(getComputedStyle(this.card).top) || 0;
      /* const initialSkewX =
        parseInt(getComputedStyle(this.card).transform.split('(')[1]) || 0;
      const initialSkewY =
        parseInt(getComputedStyle(this.card).transform.split(',')[1]) || 0;
      const initialScaleX =
        parseInt(getComputedStyle(this.card).transform.split('(')[1]) || 0;
      const initialScaleY =
        parseInt(getComputedStyle(this.card).transform.split(',')[1]) || 0;
      const initialScaleZ =
        parseInt(getComputedStyle(this.card).transform.split(',')[1]) || 0; */

      const moveFrame = (timestamp: number) => {
        const progress = Math.min(
          1,
          (timestamp - startTime) / animationDuration
        );

        this.card!.style.left =
          initialLeft + progress * (this.mouseX - initialLeft) + 50 + 'px';
        this.card!.style.top =
          initialTop + progress * (this.mouseY - initialTop) + 50 + 'px';
        /* this.card!.style.transform = `skew(${initialSkewX + progress * 5}deg, ${
          initialSkewY + progress * 5
        }deg)`;
        this.card!.style.transform = `scale(${
          initialScaleX + progress * 5
        }deg, ${initialScaleY + progress * 5}deg, ${
          initialScaleZ + progress * 5
        }deg)`; */

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

  // ! Инициализировать переменную card после отображения представления
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
