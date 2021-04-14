/**
 *
 * multi-checkbox selector base on jQuery-UI Autocomplete
 * when seleting an item, a button which has that item's properties appears
 * on the specific location user designated.
 *
 * HOW TO USE:
 *   new SearchMultiCheck(config)
 *
 *   @config - it's type of Object
 *
 * EXAMPLE 1:
 *   new SearchMultiCheck({
 *       source: '/admin/tag/gettags/journalist',
 *       inputSelector:'#left-keyword',
 *       btnBoxSelector: '#srch_field_box',
 *       chkData: {tid:'tname',label:'label',cnt:'count',tid:'tagID',tname:'value'},
 *       buttonMaker: jfilter.searchButtonMaker,
 *       uniqKey: 'tid',
 *       eventHandlers: {
 *           search: function(){
 *               console.log('Searching ...');
 *           }
 *       }
 *   });
 *
 *  // config-properties required
 *
 *  @source -  where you get the source
 *  @inputSelector - CSS-Selector of the input you typewrite into
 *  @btnBoxSelector - CSS-Selector of the container where buttons reside. it should be a UL dom.
 *  @chkData: object that has ui.item.properties as keys and counterpart button properties' name as value.
 *            this checkData is used for button. and you can make custom button using this properties.
 *  @uniqKey: unique ui.item property that makes that ui.item unique
 *
 *  // config-properties optional
 *
 *  @buttonMaker:  a callback function that event handler uses to make button when you select checkbox.
 *                 if you omit  this, SearchMultiCheck.makeOption.defaultButtonMaker is used.
 *  @eventHandlers:  event-handler for jQuery-Ui autocomplete event.
 *                  only 'change','create','search' and 'response' events are allowed.
 *
 */
class SearchMultiCheck {

    makeOption() {

        ////////////////////////////////////////////
        // VALIDATION CHECK
        ////////////////////////////////////////////
        const config = this.config;
        const essentials = ['source', 'inputSelector', 'btnBoxSelector', 'chkData'];
        const eventNames = ['change','create','search','response'];

        const defaultButtonMaker = function(uniqKey,checkBox){
            const btnText = $(checkBox).closest('li').text().trim();
            const uniqVal = $(checkBox).attr(uniqKey);
            const btn = '<span class="label radius float" '+uniqKey+'="'+uniqVal+'">'+btnText+' &#x2717;</span>';
            return btn;
        };

        essentials.forEach(function(key){
            if(! config.hasOwnProperty(key)){
                throw Error(key + ' is required');
                if(key=='checkCallback'){
                    if(typeof config.checkCallback !== 'function'){
                        throw Error('checkCallback should be a function !');
                    }
                }
            }
        });


        if(config.hasOwnProperty('eventHandlers')){
            if(typeof config.eventHandlers == 'object'){
                Object.keys(config.eventHandlers).forEach(function(eventName){
                    if(eventNames.indexOf(eventName) > -1){
                        if(typeof config.eventHandlers[eventName]=='function'){
                            opt[eventName] = config.eventHandlers[eventName];
                        } else {
                            throw Error(`eventHandler [${config.eventHandlers[eventName]}] should be a function`);
                        }
                    }
                })
            }
        }

        if(config.hasOwnProperty('buttonMaker')){
            if(typeof  config.buttonMaker !== 'function'){
                throw Error('buttonMaker should be a function');
            }
        } else {
            config.buttonMaker = defaultButtonMaker;
        }

        /**
         * get event-on-checkbox handler
         * @param instance
         * @returns {eventHandler}
         */
        const getCheckHandler = function (instance){

            return function(){
                const uniqVal = $(this).attr(config.uniqKey);

                if($(this).is(':checked')){
                    const btmaker = config.buttonMaker;
                    const chkbox = $(this).get(0);
                    const uniqVal = $(this).attr(config.uniqKey);
                    const label = $(this).closest('label').text().trim();

                    let btn = btmaker(chkbox);
                    btn = `<li ${config.uniqKey}="${uniqVal}" label="${label}">${btn}</li>`;
                    $(config.btnBoxSelector).append(btn);
                    $(config.btnBoxSelector +' li').last().on('click',function(){
                        $(this).remove();
                    });
                } else {
                    const realBtn = $(config.btnBoxSelector +' li['+config.uniqKey+'="'+uniqVal+'"]');
                    if(realBtn.length){
                        realBtn.remove();
                    }
                }
            }
        }

        // const checkHandler = getCheckHandler(this);

        /////////////////////////////////////////////////////////
        //  OPTION MAKING METHODS : opener, focuser, selecor
        ////////////////////////////////////////////////////////

        /**
         * set open-event handler
         * @param instance
         * @returns {function(*, *): void}
         */
        const opener = function(instance){

            return function(event,ui){

                let labels = [];
                $(config.btnBoxSelector+' li').each(function (){
                    labels.push($(this).attr('label'));
                });

                $('ul.ui-autocomplete:visible li').each(function(){
                    const label = $(this).text().trim();
                    let to_be_check = false;
                    if(labels.length){
                        if(labels.indexOf(label) > -1) to_be_check = true;
                    }
                    if(to_be_check){
                        $(this).html('<label><input type="checkbox" checked style="margin-bottom: 0px;"> '+label+'</label>');
                    } else {
                        $(this).html('<label><input type="checkbox" style="margin-bottom: 0px;"> '+label+'</label>');
                    }
                });

                instance.searchWord = $(config.inputSelector).val();
                instance.uiid = $('ul.ui-autocomplete:visible').attr('id');

                const checkHandler = getCheckHandler(instance);
                $('#'+instance.uiid+' input').on('click',checkHandler);
            }
        }


        /**
         * set focus-event handler
         * @param instance
         * @returns {function(*, *): void}
         */
        const focuser = function(instance){
            return function(event,ui){
                const selected = $('ul#'+instance.uiid+' li:contains("'+ui.item.label+'") input');
                Object.keys(config.chkData).forEach(function(key){
                    selected.attr(key,ui.item[config.chkData[key]]);
                });
            }
        }

        /**
         * set select-event handler
         * @param instance
         * @returns {function(): void}
         */
        const selctor = function(instance){
            return function(){
                let listOpen;
                let checkOpen = setInterval(function(){
                    listOpen = $('#'+instance.uiid).is(':visible');
                    if(listOpen){
                        clearInterval(checkOpen);
                    } else {
                        $('#'+instance.uiid).show();
                        $(config.inputSelector).val(instance.searchWord);
                    }
                },1);
            }
        }

        /////////////////////////////////////////////////////////
        //  MAKE OPTION
        ////////////////////////////////////////////////////////

        const opt = new Object();
        opt.source = config.source;
        opt.delay = 500;
        opt.open = opener(this);
        opt.focus = focuser(this);
        opt.select = selctor(this);
        this.autoCompleteOption = opt;
    }

    removeConfig(name){
        const removable = []
    }

    update(config){
        const newConfig = this.config;
        const currInputSelector = this.config.inputSelector;

        if(typeof config == 'object'){
            Object.keys(config).forEach(function(key){
                if(key == 'inputSelector'){
                    if(key !== currInputSelector){
                        throw Error('inputSelector is unchangeable!');
                    }
                }
                const val = config[key];
                if(val==''||val==undefined||val==null){
                    delete(targetConfig[key]);
                } else {
                    newConfig[key] = val;
                }
            });
            this.config = newConfig;
            $(this.config.inputSelector).autocomplete('destroy');
            this.makeOption();
            this.run();
        }
    }

    run(){
        $(this.config.inputSelector).autocomplete(this.autoCompleteOption);
    }

    constructor(config) {
        this.config = config;
        this.makeOption();
        this.run();
    }
}