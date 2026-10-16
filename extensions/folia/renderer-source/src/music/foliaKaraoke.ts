/** Active character colour is based on the real sung interval, never its entrance-animation duration. */
export function foliaKaraokeColor(time: number, start: number, end: number, normal: string, active: string): string {
  return time >= start && time < end ? active : normal;
}
