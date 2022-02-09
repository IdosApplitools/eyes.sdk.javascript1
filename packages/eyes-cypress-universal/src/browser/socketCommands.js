const spec = require('../../dist/browser/spec-driver');

function socketCommands(socket, refer) {
  socket.command('Driver.executeScript', ({context, script, arg = []}) => {
    return spec.executeScript(refer.deref(context), script, derefArgs(arg));
  });
  socket.command('Driver.mainContext', context => {
    const mainContext = spec.mainContext(refer.deref(context));
    return refer.ref(mainContext, context);
  });
  socket.command('Driver.isElement', element => {
    return spec.isElement(element);
  });
  socket.command('Driver.isSelector', selector => {
    return spec.isElement(selector);
  });
  socket.command('Driver.getViewportSize', () => {
    return spec.getViewportSize();
  });
  socket.command('Driver.setViewportSize', vs => {
    spec.setViewportSize(vs);
  });
  socket.command('Driver.findElement', ({context, selector}) => {
    if(isSelector(selector)) {
      const res = spec.findElement(refer.deref(context), transformSelector(refer.deref(selector)));
      return refer.ref(res);
    } else{
      // add some error handling here 

    }

  });
  socket.command('Driver.findElements', ({context, selector}) => {
    if(isSelector(selector)) {
    const elements = spec.findElements(refer.deref(context), transformSelector(refer.deref(selector)));
    let result = []
    for(const el of elements){
      result.push(refer.ref(el))
    }
    return result
  } else {
    // add some error handling here
  }

  });

  socket.command('Driver.parentContext', currentContext => {
    const context = spec.parentContext(refer.deref(currentContext));
    return refer.ref(context);
  });

  socket.command('Driver.getCookies', (context) => {
    return spec.getCookies(refer.deref(context.driver))
  })

  socket.command('Driver.getUrl', (context) => {
    return spec.getUrl(refer.deref(context))
  })

  socket.command('Driver.getTitle', (context) => {
    return spec.getTitle(refer.deref(context.driver))
  })

  socket.command('Driver.childContext', ({context, element}) => {
    return spec.childContext(refer.deref(context), refer.deref(element))
  }) 
  

  // utils
  function derefArgs(arg){
    if(Array.isArray(arg)) {
    const derefArg = [];
    for (const argument of arg) {
      if(Array.isArray(argument)){
        const arr = [];
        for(const entry of argument){
          arr.push(refer.deref(entry))
        }
        derefArg.push(refer.deref(arr))
      } else {
      derefArg.push(refer.deref(argument))
      } 
    }
    return derefArg
    } else {
      return arg
    }
  }

  function transformSelector(selector) {
    if(isSelector(selector)) {
      if(isSelector(selector.selector) && typeof(selector.selector.selector) === 'string')
        return selector.selector.selector
      else if (typeof(selector.selector) == 'string')
        return selector.selector
    }
  }

  function isSelector(selector) {
    return selector.hasOwnProperty('selector');
  }

}

module.exports = {socketCommands};
