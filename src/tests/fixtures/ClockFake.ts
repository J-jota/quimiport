import type { Clock } from '../../application/ports/Clock.js';

/** Clock fake para testes determinísticos (plano de qualidade, seção 8). */
export class ClockFake implements Clock {
  constructor(private instante: Date = new Date('2026-01-15T12:00:00.000Z')) {}

  agora(): Date {
    return this.instante;
  }

  fixar(instante: Date): void {
    this.instante = instante;
  }
}
