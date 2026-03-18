export class MemoryHelper {
  static get sizeOfInt() {
    return 4;
  }

  static writeSingleBit(buffer, bitIndex, value) {
    const byteIndex = bitIndex >> 3;
    const bitMask = 1 << (bitIndex & 7);
    const view = new Uint8Array(buffer);
    if (value) {
      view[byteIndex] |= bitMask;
    } else {
      view[byteIndex] &= ~bitMask;
    }
  }
}

