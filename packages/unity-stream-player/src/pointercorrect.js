export const LetterBoxType = {
  Vertical: 0,
  Horizontal: 1,
};

export class PointerCorrector {
  constructor(videoWidth, videoHeight, videoElem) {
    this.reset(videoWidth, videoHeight, videoElem);
  }

  map(position) {
    const rect = this._videoElem.getBoundingClientRect();
    const _position = new Array(2);
    _position[0] = position[0] - rect.left;
    _position[1] = position[1] - rect.top;
    _position[1] = rect.height - _position[1];
    _position[0] -= this._contentRect.x;
    _position[1] -= this._contentRect.y;
    _position[0] = (_position[0] / this._contentRect.width) * this._videoWidth;
    _position[1] =
      (_position[1] / this._contentRect.height) * this._videoHeight;
    return _position;
  }

  setVideoWidth(videoWidth) {
    this._videoWidth = videoWidth;
    this._reset();
  }

  setVideoHeight(videoHeight) {
    this._videoHeight = videoHeight;
    this._reset();
  }

  setRect(videoElem) {
    this._videoElem = videoElem;
    this._reset();
  }

  reset(videoWidth, videoHeight, videoElem) {
    this._videoWidth = videoWidth;
    this._videoHeight = videoHeight;
    this._videoElem = videoElem;
    this._reset();
  }

  get letterBoxType() {
    const videoRatio = this._videoHeight / this._videoWidth;
    const rect = this._videoElem.getBoundingClientRect();
    const rectRatio = rect.height / rect.width;
    return videoRatio > rectRatio
      ? LetterBoxType.Vertical
      : LetterBoxType.Horizontal;
  }

  get letterBoxSize() {
    const rect = this._videoElem.getBoundingClientRect();
    switch (this.letterBoxType) {
      case LetterBoxType.Horizontal: {
        const ratioWidth = rect.width / this._videoWidth;
        const height = this._videoHeight * ratioWidth;
        return ((rect.height - height) * 0.5) | 0;
      }
      case LetterBoxType.Vertical: {
        const ratioHeight = rect.height / this._videoHeight;
        const width = this._videoWidth * ratioHeight;
        return ((rect.width - width) * 0.5) | 0;
      }
    }
    throw new Error("invalid status");
  }

  get contentRect() {
    const letterBoxType = this.letterBoxType;
    const letterBoxSize = this.letterBoxSize;
    const rect = this._videoElem.getBoundingClientRect();
    const x = letterBoxType == LetterBoxType.Vertical ? letterBoxSize : 0;
    const y = letterBoxType == LetterBoxType.Horizontal ? letterBoxSize : 0;
    const width =
      letterBoxType == LetterBoxType.Vertical
        ? rect.width - letterBoxSize * 2
        : rect.width;
    const height =
      letterBoxType == LetterBoxType.Horizontal
        ? rect.height - letterBoxSize * 2
        : rect.height;
    return { x, y, width, height };
  }

  _reset() {
    this._contentRect = this.contentRect;
  }
}

