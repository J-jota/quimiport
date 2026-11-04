/** Porta de relógio — permite controlar "agora" nos testes (RN-14). */
export interface Clock {
  agora(): Date;
}

export class SystemClock implements Clock {
  agora(): Date {
    return new Date();
  }
}
