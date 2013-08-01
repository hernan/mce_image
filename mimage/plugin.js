/**
 * plugin.js
 *
 * 2013, Hernan Fernandez
 * Released under LGPL License.
 *
 * Contributing: https://github.com/hernan/mce_image
 */

tinymce.PluginManager.add('mimage', function(editor, url) {

  function createImageList(callback) {
    return function() {
      var imageList = editor.settings.image_list_url;

      if( typeof(imageList) === "string" ){
        tinymce.util.XHR.send({
          url: imageList,
          success: function(text) {
            callback(tinymce.util.JSON.parse(text));
          }
        });
      } else {
        console.log('ERROR: must provide an url to get the image list as a JSON object');
      }
    };
  }

  function getImageSize(url, callback) {
    var img = document.createElement('img');

    function done(width, height) {
      img.parentNode.removeChild(img);
      callback({width: width, height: height});
    }

    img.onload = function() {
      done(img.clientWidth, img.clientHeight);
    };

    img.onerror = function() {
      done();
    };

    img.src = url;

    var style = img.style;
    style.visibility = 'hidden';
    style.position = 'fixed';
    style.bottom = style.left = 0;
    style.width = style.height = 'auto';

    document.body.appendChild(img);
  }

  function showDialog(imageList){
    var win, width, height, data, htmlGrid = '';
    var dom = editor.dom;
    var imgElm = editor.selection.getNode();
    
    function onSubmitForm() {
      function waitLoad(imgElm) {
        function selectImage() {
          imgElm.onload = imgElm.onerror = null;
          editor.selection.select(imgElm);
          editor.nodeChanged();
        }

        imgElm.onload = function() {
          if (!data.width && !data.height) {
            dom.setAttribs(imgElm, {
              width: imgElm.clientWidth,
              height: imgElm.clientHeight
            });
          }

          selectImage();
        };

        imgElm.onerror = selectImage;
      }

      var data = win.toJSON();
      if (data.width === '') {
        data.width = null;
      }

      if (data.height === '') {
        data.height = null;
      }

      if (data.style === '') {
        data.style = null;
      }

      data = {
        src: data.src,
        alt: data.alt,
        width: data.width,
        height: data.height,
        style: data.style
      };

      if (!imgElm) {
        data.id = '__mcenew';
        editor.insertContent(dom.createHTML('img', data));
        imgElm = dom.get('__mcenew');
        dom.setAttrib(imgElm, 'id', null);
      } else {
        dom.setAttribs(imgElm, data);
      }

      waitLoad(imgElm);
    }
    
    function onShowImages(){
      if (!data) { return; }
      $('img[src="'+ data.src +'"]').addClass('mce-imagelist-selected');
    }
    
    function updateStyle(){
      function addPixelSuffix(value) {
        if (value.length > 0 && /^[0-9]+$/.test(value)) {
          value += 'px';
        }

        return value;
      }

      var data = win.toJSON();
      var css = dom.parseStyle(data.style);

      delete css.margin;
      css['margin-top'] = css['margin-bottom'] = addPixelSuffix(data.vspace);
      css['margin-left'] = css['margin-right'] = addPixelSuffix(data.hspace);
      css['border-width'] = addPixelSuffix(data.border);

      win.find('#style').value(dom.serializeStyle(dom.parseStyle(dom.serializeStyle(css))));
    }
    
    function updateSize(url) {
      getImageSize(url, function(data) {
        if (data.width && data.height) {
          width = data.width;
          height = data.height;

          win.find('#width').value(width);
          win.find('#height').value(height);
        }
      });
    }
    
    function recalcSize(e){
      var widthCtrl, heightCtrl, newWidth, newHeight;

      widthCtrl = win.find('#width')[0];
      heightCtrl = win.find('#height')[0];

      newWidth = widthCtrl.value();
      newHeight = heightCtrl.value();

      if (win.find('#constrain')[0].checked() && width && height && newWidth && newHeight) {
        if (e.control == widthCtrl) {
          newHeight = Math.round((newWidth / width) * newHeight);
          heightCtrl.value(newHeight);
        } else {
          newWidth = Math.round((newHeight / height) * newWidth);
          widthCtrl.value(newWidth);
        }
      }

      width = newWidth;
      height = newHeight;
    }
    
    function removePixelSuffix(value) {
      if (value) {
        value = value.replace(/px$/, '');
      }

      return value;
    }
    
    function selectImage(ev){
      var target = ev.target;
      var img_src;
      
      if (target.nodeName === 'IMG') {
        win.find('#src').value(target.getAttribute('src'));
        win.find('#alt').value(target.getAttribute('alt'));
        
        dom.removeClass($('.mce-imagelist-selected'), 'mce-imagelist-selected');
        dom.addClass(ev.target, 'mce-imagelist-selected');
        
        updateSize(target.getAttribute('src'));
      }

    }
    
    if (!imageList) {
      return;
    }
    
    tinymce.each(imageList, function(image){
      htmlGrid += '<img src="'+ image.url +'" alt="'+ image.caption +'" style="width:160px;height:100px; border: 2px solid #efefef; padding: 3px; float: left; margin:10px 0 10px 10px; " />';
    });
    
    width = dom.getAttrib(imgElm, 'width');
    height = dom.getAttrib(imgElm, 'height');
    
    if (imgElm.nodeName == 'IMG' && !imgElm.getAttribute('data-mce-object')) {
      data = {
        src: dom.getAttrib(imgElm, 'src'),
        alt: dom.getAttrib(imgElm, 'alt'),
        width: width,
        height: height,
        hspace: removePixelSuffix(imgElm.style.marginLeft || imgElm.style.marginRight),
        vspace: removePixelSuffix(imgElm.style.marginTop || imgElm.style.marginBottom),
        border: removePixelSuffix(imgElm.style.borderWidth),
        style: editor.dom.serializeStyle(editor.dom.parseStyle(editor.dom.getAttrib(imgElm, 'style')))
      }
      
    } else {
      imgElm = null;
    }
    
    win = editor.windowManager.open({
      data: data,
      title: 'Insert/edit image',
      bodyType: 'tabpanel',
      body: [
        { //1st tab
          title: 'Select Image',
          type: 'container',
          name: 'imagelist',
          html: htmlGrid,
          minWidth: 600,
          minHeight: 400,
          padding: 20,
          onclick: selectImage,
          onShowTab: onShowImages
        },
        { //2nd tab
          title: 'Image Data',
          type: 'form',
          items: [
            {
              label: 'Name', name: 'src', type: 'textbox'
            },
            {
              label: 'Caption', name: 'alt', type: 'textbox'
            },
            {
              type: 'container',
              label: 'Dimensions',
              layout: 'flex',
              direction: 'row',
              align: 'center',
              spacing: 5,
              items: [
                {name: 'width', type: 'textbox', maxLength: 3, size: 3, onchange: recalcSize},
                {type: 'label', text: 'x'},
                {name: 'height', type: 'textbox', maxLength: 3, size: 3, onchange: recalcSize},
                {name: 'constrain', type: 'checkbox', checked: true, text: 'Constrain proportions'}
              ]
            },
            {
              type: 'form',
              pack: 'start',
              padding: 0,
              items: [
                {
                  //label: 'Style',
                  hidden: true,
                  name: 'style',
                  type: 'textbox',
                  
                },
                {
                  type: 'form',
                  layout: 'grid',
                  packV: 'start',
                  columns: 2,
                  padding: 0,
                  alignH: ['left', 'left'],
                  defaults: {
                    type: 'textbox',
                    maxWidth: 50,
                    onchange: updateStyle
                  },
                  items: [
                    {label: 'Vertical space', name: 'vspace'},
                    {label: 'Horizontal space', name: 'hspace'},
                    {label: 'Border', name: 'border'}
                  ]
                }
              ]
            }

          ]
        }
      ],
      onSubmit: onSubmitForm,
      onrender: function(){ console.log('show'); }
    });
  }

  editor.addButton('mimage', {
    icon: 'image',
    tooltip: 'Insert/edit image',
    onclick: createImageList(showDialog),
    stateSelector: 'img:not([data-mce-object])'
  });

  // editor.addMenuItem('mimage', {
  //   icon: 'image',
  //   text: 'Insert image',
  //   onclick: createImageList(showDialog),
  //   context: 'insert',
  //   prependToContext: true
  // });


});