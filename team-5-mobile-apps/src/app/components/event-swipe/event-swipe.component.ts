import { Component, ElementRef, Input, Output, EventEmitter, ViewChild, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-event-swipe',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './event-swipe.component.html',
  styleUrls: ['./event-swipe.component.scss'],
})
export class EventSwipeComponent implements OnInit {
  
  
  @Input() events: any[] = []; 

  
  @Output() swiped = new EventEmitter<{ id: string; liked: boolean }>();

  
  dragging = false;
  startX = 0;
  startY = 0;
  translateX = 0;
  translateY = 0;
  rotation = 0;

  @ViewChild('topCard', { static: false }) topCard?: ElementRef<HTMLElement>;

  constructor() {}

  ngOnInit() {}


  onPointerDown(ev: PointerEvent) {
    if (!this.events.length) return;
    this.dragging = true;
    this.startX = ev.clientX;
    this.startY = ev.clientY;
    (ev.target as Element).setPointerCapture(ev.pointerId);
  }

  onPointerMove(ev: PointerEvent) {
    if (!this.dragging) return;
    this.translateX = ev.clientX - this.startX;
    this.translateY = ev.clientY - this.startY;
    this.rotation = this.translateX / 20;
    this.applyTransform();
  }

  onPointerUp(ev: PointerEvent) {
    if (!this.dragging) return;
    this.dragging = false;
    const threshold = 120;
    
    // Check ID of the top card
    const id = this.topEvent?.id;
    if (!id) return this.resetTransform();

    if (this.translateX > threshold) {
      // Swipe RIGHT (Like)
      this.finishSwipe(id, true);
    } else if (this.translateX < -threshold) {
      // Swipe LEFT (Dislike)
      this.finishSwipe(id, false);
    } else {
      this.resetTransform();
    }
  }

  // --- HELPERS ---

  get topEvent(): any | undefined {
    return this.events && this.events.length ? this.events[0] : undefined;
  }

  getCardStyle(i: number) {
    const offset = Math.min(i, 3);
    if (i === 0) {
      return {
        transform: `translate(${this.translateX}px, ${this.translateY}px) rotate(${this.rotation}deg)`,
        transition: this.dragging ? 'none' : 'transform 200ms ease',
        zIndex: 100
      } as any;
    }
    const scale = 1 - offset * 0.03;
    const translateY = offset * 12; 
    return {
      transform: `translateY(${translateY}px) scale(${scale})`,
      zIndex: 100 - i
    } as any;
  }

  get indicatorOpacity() {
    const thr = 120;
    return Math.min(Math.abs(this.translateX) / thr, 1);
  }

  applyTransform() {
    if (!this.topCard) return;
    const el = this.topCard.nativeElement;
    el.style.transition = 'none';
    el.style.transform = `translate(${this.translateX}px, ${this.translateY}px) rotate(${this.rotation}deg)`;
  }

  resetTransform() {
    if (!this.topCard) return;
    const el = this.topCard.nativeElement;
    el.style.transition = 'transform 200ms ease';
    el.style.transform = '';
    this.translateX = 0;
    this.translateY = 0;
    this.rotation = 0;
  }

  animateOut(direction: number) {
    if (!this.topCard) return;
    const el = this.topCard.nativeElement;
    el.style.transition = 'transform 300ms ease-out';
    const offX = direction * (window.innerWidth + 200);
    const offY = this.translateY;
    el.style.transform = `translate(${offX}px, ${offY}px) rotate(${direction * 30}deg)`;
  }

  // --- ACTIONS ---

  onLike() {
    if (this.topEvent) this.finishSwipe(this.topEvent.id, true);
  }

  onDislike() {
    if (this.topEvent) this.finishSwipe(this.topEvent.id, false);
  }

  private finishSwipe(id: string, liked: boolean) {
    const direction = liked ? 1 : -1;
    this.animateOut(direction);

   
    this.swiped.emit({ id, liked });

    
    setTimeout(() => {
        this.events.shift(); 
        this.resetTransform(); 
    }, 200);
  }
}