//import getAllUrlParams from '../src/index';
//import('../src/index');
//import * as index from '../src/index';
import { * } from '../src/index';


describe('index functions', () => {

  it('should get the url parameters', () => {

    console.log('index = ' + index);
    //console.log('getAllUrlParams = ' + getAllUrlParams);

    expect('hello').toBeTruthy();
    index.getAllUrlParams('http://123');
  });

});
