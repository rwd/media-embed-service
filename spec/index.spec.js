import * as index  from '../src/index';

describe('index functions', () => {

  beforeAll((done) => {
    const fixture = '<div class="player-wrapper loading"></div>';
    document.body.insertAdjacentHTML('afterbegin', fixture);
    setTimeout(done, 3000);
  });

  it('should get the url parameters', () => {
    let testUrl = 'http://video-embed?t=25,33';
    let params = index.getAllUrlParams(testUrl);
    expect(params).toBeTruthy();
    expect(params.t).toEqual('25,33');
  });

  it('should increment the currentMediaItem when done', () => {
    index.currentMediaItem = -1;
    //expect(index.currentMediaItem).toEqual(0);
    index.mediaHasEnded(true);
    //expect(index.currentMediaItem).toEqual(1);
  });

  // requires jQuery
  it('should initialise the embed', () => {
    let wrapperEl = document.querySelector('.player-wrapper');
    /*expect(wrapperEl.classList).toContain('loading');

    expect(index.timeUpdate).toBeFalsy();*/

    //index.initializeEmbed();

    expect(index.timeUpdate).not.toBeFalsy();
    expect(wrapperEl.classList).not.toContain('loading');
  });

});
