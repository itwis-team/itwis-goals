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
import { Subject } from 'rxjs';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('cursor') cursor!: ElementRef;
  @ViewChild('swiper', { static: false }) swiperElement!: any;
  /* @ViewChild('cardWrapper') cardWrapper!: ElementRef; */
  @ViewChildren('.card') cards: QueryList<ElementRef> | undefined;

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

  private slideChangeSubject = new Subject<number>();
  private initialCardPositions: Map<HTMLElement, DOMRect> = new Map();
  private swiperActive: boolean = false;

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

  // * Переписанные методы
  updateCardOnSlideChange(activeSlideIndex: number) {
    const cardsOfCurrentSlide = document
      .querySelectorAll('.swiper-slide')
      [activeSlideIndex]?.querySelectorAll('.card');

    if (cardsOfCurrentSlide && cardsOfCurrentSlide.length > 0) {
      this.card = cardsOfCurrentSlide[0] as HTMLElement;
      const currentSlideRect = document
        .querySelectorAll('.swiper-slide')
        [activeSlideIndex].getBoundingClientRect();

      this.resetCardPositions();
      this.moveCardSmoothly(currentSlideRect);
    }
  }

  updateContainerBackgroundColor(activeSlideIndex: number) {
    if (this.allItems[activeSlideIndex]) {
      const bgColor = this.allItems[activeSlideIndex].bgcolor;
      const container = document.querySelector('.container');
      if (container) {
        this.renderer.setStyle(container, 'background-color', bgColor);
      }
    }
  }

  // * Новый способ через подписку на изменения слайда
  subscribeToSlideChange() {
    if (this.swiperElement && this.swiperElement.swiper) {
      this.swiper = this.swiperElement.swiper;
      this.swiperElement.swiper.on('slideChange', () => {
        /* console.log(this.swiperElement.swiper.activeIndex); */
        const activeSlideIndex = this.swiperElement.swiper.activeIndex;
        this.updateContainerBackgroundColor(activeSlideIndex);
        this.updateCardOnSlideChange(activeSlideIndex);
        this.resetCardPositionsForCurrentSlide(activeSlideIndex);
        this.resetCardPositions();
        this.updateInitialCardPositions();
      });
    }
  }

  // * Сохрнаить начальные позиции каждой карточки в map
  updateInitialCardPositions() {
    this.cards?.forEach((card, _index) => {
      console.log(this.cards);

      const cardElement = card.nativeElement;
      const cardRect = cardElement.getBoundingClientRect();
      this.initialCardPositions.set(cardElement, cardRect);
    });
  }

  // * Вернуть карточку в исходное положение
  resetCardPositions() {
    this.initialCardPositions.forEach((cardRect, cardElement) => {
      cardElement.style.left = cardRect.left + 'px';
      //   cardElement.style.left = `calc(${cardRect.left}px - 100vw)`;
      cardElement.style.top = cardRect.top + 'px';
    });
  }

  // * Принять индекс активного слайда
  resetCardPositionsForCurrentSlide(activeSlideIndex: number) {
    const currentSlideCards = document
      .querySelectorAll('.swiper-slide')
      [activeSlideIndex]?.querySelectorAll('.card');

    if (currentSlideCards && currentSlideCards.length > 0) {
      currentSlideCards.forEach((card) => {
        const cardElement = card as HTMLElement;
        const initialPosition = this.initialCardPositions.get(cardElement);
        if (initialPosition) {
          cardElement.style.left = initialPosition.left + 'px';
          cardElement.style.top = initialPosition.top + 'px';
        }
      });
    }
  }

  ngAfterViewInit() {
    // this.swiperElement.swiper.on('slideChange', () => {
    // });

    this.initializeCardPositions();
    console.log(this.initialCardPositions);

    this.cards?.forEach((card, _index) => {
      const cardElement = card.nativeElement;
      const cardRect = cardElement.getBoundingClientRect();
      this.initialCardPositions.set(cardElement, cardRect);
    });

    this.cards?.changes.subscribe(() => {
      this.initializeCardPositions();
    });
    console.log('Cards changed:', this.cards);

    const swiperWrapper = document.querySelector('.swiper-wrapper');
    let currentSlideRect: DOMRect | null = null;

    if (swiperWrapper) {
      currentSlideRect = swiperWrapper.getBoundingClientRect();
    }
    // * Создание подписки на поток

    this.slideChangeSubject.subscribe((activeSlideIndex: number) => {
      this.updateCardOnSlideChange(activeSlideIndex);
    });
    /*    // ! Инициализировать Swiper после отображения представления
		this.subscribeToSlideChange();
	*/
    /* const cardElement = this.cardWrapper.nativeElement.querySelector('.card'); */

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

    // ! Новая анимация карточки через Three.js

    /*   this.card = this.elRef.nativeElement.querySelector('.card');

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

    // ! Повторно инициализировать анимацию карточки при отображении

    /* this.initializeCardAnimation() */
    this.subscribeToSlideChange();
    this.updateContainerBackgroundColor(this.swiperElement.activeIndex);
    this.updateCardOnSlideChange(this.swiperElement.activeIndex);

    // ! Баг с верстикальным скролом
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

  initializeCardPositions() {
    this.cards?.forEach((card, _index) => {
      const cardElement = card.nativeElement;
      const cardRect = cardElement.getBoundingClientRect();
      this.initialCardPositions.set(cardElement, cardRect);
    });
  }

  swipeSlide(direction: 'next' | 'prev') {
    if (direction === 'next') {
      this.swiperElement.swiper.slideNext();
    } else {
      this.swiperElement.swiper.slidePrev();
    }
  }

  ngOnDestroy() {
    // ! Отписываемся от события transitionEnd при уничтожении компонента
    this.swiperElement.swiper.off('transitionEnd', this.handleTransitionEnd);

    // * Очистка подписки

    this.slideChangeSubject.unsubscribe();
  }

  // ! Обноавление методов при смене слайда
  /* subscribeToSlideChange() {
		if (this.swiperElement && this.swiperElement.swiper) {
		this.swiper = this.swiperElement.swiper;
		const activeSlideIndex = this.swiper.activeIndex;

		this.swiper.on('slideChangeTransitionEnd', () => {
			this.updateContainerBackgroundColor();
			this.cdr.detectChanges();
			this.moveCardOnCurrentSlide(activeSlideIndex);
			this.initializeCardAnimation();	

			console.log('новый слайд');
		});
		}
	} */

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

  // ! Обработчик завершения анимации перехода слайда
  handleTransitionEnd = () => {
    this.card = null;
    this.cards?.forEach((card, index) => {
      if (index === this.swiperElement.activeIndex) {
        this.card = card.nativeElement;
      }
    });
  };

  // ! Инициализировать переменную card после смены слайда
  initializeCardAnimation() {
    this.cards?.forEach((card, index) => {
      if (index === this.swiperElement.activeIndex) {
        this.card = card.nativeElement;
      }
    });
  }

  // ! Логика анимации карточки
  moveCardSmoothly(currentSlideRect: DOMRect | null) {
    if (this.card && currentSlideRect) {
      this.isCardMoving = true;
      const animationDuration = 4000;
      const startTime = performance.now();
      const initialLeft = parseInt(getComputedStyle(this.card).left) || 0;
      const initialTop = parseInt(getComputedStyle(this.card).top) || 0;

      const moveFrame = (timestamp: number) => {
        const progress = Math.min(
          1,
          (timestamp - startTime) / animationDuration
        );

        // * Получаем границы текущего слайда
        const slideLeft = currentSlideRect.left;
        const slideTop = currentSlideRect.top;
        const slideRight =
          slideLeft +
          currentSlideRect.width -
          (this.card ? this.card.offsetWidth : 0);
        const slideBottom =
          slideTop +
          currentSlideRect.height -
          (this.card ? this.card.offsetHeight : 0);

        const newLeft = Math.min(
          Math.max(
            slideLeft,
            initialLeft + progress * (this.mouseX - initialLeft)
          ),
          slideRight
        );
        const newTop = Math.min(
          Math.max(
            slideTop,
            initialTop + progress * (this.mouseY - initialTop)
          ),
          slideBottom
        );

        if (this.card) {
          this.card.style.left = newLeft + 'px';
          this.card.style.top = newTop + 'px';
        }

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

  // ! Изменить цвет фона, учитвая номер слайда
  /*  updateContainerBackgroundColor() {
		const activeSlideIndex = this.swiper.activeIndex;
		if (this.allItems[activeSlideIndex]) {
		const bgColor = this.allItems[activeSlideIndex].bgcolor;
		const container = document.querySelector('.container');
		if (container) {
			this.renderer.setStyle(container, 'background-color', bgColor);
		}
		}
	} */

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
