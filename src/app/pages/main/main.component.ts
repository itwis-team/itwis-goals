import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  AfterViewInit,
  Renderer2,
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
  card: HTMLElement | null = null;
  mouseX = 0;
  mouseY = 0;
  isCardMoving = false;
  runAnimation: boolean = true;
  swiperActive: boolean = false;

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

  constructor(private renderer: Renderer2, private elRef: ElementRef) {}

  ngOnInit(): void {
    this.preparedItems = allItems.map((item) => {
      if (item.goal <= this.current) {
        item.complete = true;
      }
      if (item.prevGoal <= this.current && this.current < item.goal) {
        item.current = true;
      }
      return item;
    });
  }

  // ! Переписанные методы для работы с карточкой
  updateCardOnSlideChange(activeSlideIndex: number) {
    const cardsOfCurrentSlide = document
      .querySelectorAll('.swiper-slide')
      [activeSlideIndex]?.querySelectorAll('.card');
    if (cardsOfCurrentSlide && cardsOfCurrentSlide.length > 0) {
      this.card = cardsOfCurrentSlide[0] as HTMLElement;
      const currentSlideRect = document
        .querySelectorAll('.swiper-slide')
        [activeSlideIndex].getBoundingClientRect();
      this.moveCardSmoothly(currentSlideRect);
    }
  }

  // ! Инициализировать переменную card после смены слайда
  initializeCardAnimation() {
    const cardsArray = this.cards?.toArray();
    cardsArray?.forEach((card, index) => {
      if (index === this.swiperElement.activeIndex) {
        this.card = card.nativeElement;
      }
    });
  }

  // ! Движение карточки при смене слайда
  moveCardOnCurrentSlide(activeSlideIndex: number) {
    const cardsArray = this.cards?.toArray();
    const cardOfCurrentSlide = cardsArray
      ? cardsArray[activeSlideIndex]?.nativeElement
      : null;
    const swiperWrapper = document.querySelector('.swiper-wrapper');
    const currentSlideRect = swiperWrapper
      ? swiperWrapper.getBoundingClientRect()
      : null;
    if (cardOfCurrentSlide && !this.isCardMoving && currentSlideRect) {
      this.card = cardOfCurrentSlide;
      this.moveCardSmoothly(currentSlideRect);
    }
  }

  // ! Логика анимации карточки
  moveCardSmoothly(currentSlideRect: DOMRect | null) {
    if (this.card && currentSlideRect) {
      const cardElement = this.card as HTMLElement;

      // ? Получаем координаты курсора относительно .card
      const offsetX = this.mouseX - cardElement.offsetWidth * 3.16;
      const offsetY = this.mouseY - cardElement.offsetHeight;

      // ? Координаты .card без ограничений рамками страницы
      const newLeft = offsetX;
      const newTop = offsetY;

      cardElement.style.transform = `translate(${newLeft}px, ${newTop}px) rotate(2deg)`;

      /*  let prevX = this.mouseX;

      document.addEventListener('mousemove', (e: MouseEvent) => {
        if (e.clientX < prevX) {
          cardElement.style.transform += ' skew(-55deg)';
        } else {
          cardElement.style.transform = `translate(${newLeft}px, ${newTop}px) rotate(2deg)`;
        }
        prevX = e.clientX;
      }); */
    }
  }

  // ! Изменить цвет фона при смене слайда
  updateContainerBackgroundColor(activeSlideIndex: number) {
    if (this.allItems[activeSlideIndex]) {
      const bgColor = this.allItems[activeSlideIndex].bgcolor;
      const container = document.querySelector('.container');
      if (container) {
        this.renderer.setStyle(container, 'background-color', bgColor);
      }
    }
  }

  // ! Выбрать цвет фона из data.ts
  getBackgroundColor(index: number): string {
    if (this.allItems[index]) {
      return this.allItems[index].bgcolor || 'rgba(242, 242, 242, 1)'; // ? Цвет по умолчанию
    }
    return 'rgba(242, 242, 242, 1)';
  }

  // ! Вызов методов после изменения индекса слайда
  subscribeToSlideChange() {
    if (this.swiperElement && this.swiperElement.swiper) {
      this.swiper = this.swiperElement.swiper;
      this.swiperElement.swiper.on('slideChange', () => {
        const activeSlideIndex = this.swiperElement.swiper.activeIndex;
        this.updateContainerBackgroundColor(activeSlideIndex); // ? Обновить цвет фона
        this.updateCardOnSlideChange(activeSlideIndex); // ? Выбрать новую карточку на текущем слайде и применить к ней анимацию
      });
    }
  }

  ngAfterViewInit() {
    const swiperWrapper = document.querySelector('.swiper-wrapper');
    let currentSlideRect: DOMRect | null = null;

    if (swiperWrapper) {
      currentSlideRect = swiperWrapper.getBoundingClientRect();
      if (currentSlideRect) {
        this.moveCardSmoothly(currentSlideRect);
      }
    }

    // ! Подписываемся на событие mousemove через Renderer2
    this.renderer.listen(
      this.elRef.nativeElement,
      'mousemove',
      (e: MouseEvent) => {
        this.mouseX = e.clientX;
        this.mouseY = e.clientY;

        if (!this.isCardMoving && currentSlideRect) {
          this.moveCardSmoothly(currentSlideRect);
        }
      }
    );

    this.card = this.elRef.nativeElement.querySelector('.card');

    /*   // ! Анимация карточки через Three.js

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
    render(); */

    // ! Инициалилзировать изменения при смене слайда
    this.subscribeToSlideChange();

    // ! Исправление бага с верстикальным скроллом
    this.swiperElement.swiper.on('sliderMove', () => {
      this.swiperActive = true;
    });

    this.swiperElement.swiper.on('slideChangeTransitionEnd', () => {
      this.swiperActive = false;
    });

    document.addEventListener('wheel', (event: WheelEvent) => {
      if (this.swiperActive) {
        event.preventDefault();
        const delta = Math.max(-1, Math.min(1, event.deltaY || -event.detail));
        if (delta !== 0) {
          this.swipeSlide(delta > 0 ? 'next' : 'prev');
        }
      }
    });
  }

  swipeSlide(direction: 'next' | 'prev') {
    if (direction === 'next') {
      this.swiperElement.swiper.slideNext();
    } else {
      this.swiperElement.swiper.slidePrev();
    }
  }

  // ! Обработчик завершения анимации перехода слайда
  handleTransitionEnd = () => {
    this.card = null;
    this.cards?.forEach((card, index) => {
      if (index === this.swiperElement.activeIndex) {
        this.card = card.nativeElement;
      }
    });
  };

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
    // ? Если больше 100, сани не уедут за правый край
    if (percent > 100) {
      percent = 100;
    }
    return percent;
  }
}
