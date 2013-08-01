About
-----
This is a plugin to replace the default image insert functionality with a visual image selection from a list of images get from the server as JSON.


Install
-------
Just copy the repository content to your TinyMCE plugins dir and add it to the editor initialization code, like

    <script type="text/javascript">
    tinymce.init({
        selector: 'textarea',
        plugins : 'mimage',
        image_list_url: '/clients/attachs/mcelist'
    });
    </script>

The server response should be in JSON format, like

    [ 
      { caption: 'caption text', url: 'image url' },
      { caption: 'caption text 2', url: 'image url 2' } 
    ]