/**
 * jQuery-UI Autocomplete 를 활용한 검색박스
 * 검색을 하면 결과가 체크박스 선택을 할 수 있도록 나오며
 * 선택시 선택된  개체가 버튼으로 지정된 구역에 나타남.
 * 버튼 삭제시  선택된 것도 제거되며
 * 체크박스 언체크시  버튼 또한 제거된다.
 *
 *
 * 사용법:
 *   new SearchMultiCheck(option)
 *
 *   @option - Object 유형이어야 함
 *
 * 사용예:
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
 *  // option 필수값
 *
 *  @source -  검색 소스
 *  @inputSelector - 검색어 입력 필드의 CSS Selector
 *  @btnBoxSelector - 선택된 값에 해당하는 버튼이 나타나게 될 컨테이너의  CSS Selector
 *                    해당 컨테이너는 iniline-list css class 를 가진  ul 이어야 함.
 *  @cvkData: source로 부터 넘어온 데이터(ui.item)의 속성 중 체크박스의 속성으로 저장될 것들.
 *            이 체크박스의 속성값을 가지고 버튼을 만듦
 *  @uniqKey: source 로부터 넘어온 데이터(ui.item)의 속성중 다른 데이터 값과 비교했을 때 유니크한 값을 가지게 하는 속성
 *
 *  // option 선택값
 *
 *  @buttonMaker:  체크박스 선택시 이벤트 핸들러가 버튼을 만들기 위하여 사용하는 함수.
 *                 값이 주어지지 않았을 경우에는 SearchMultiCheck.makeOption.defaultButtonMaker 을 사용함.
 *  @eventHandlers: jQuery-Ui autocomplete 의 각 event 에 대한 handler 들.
 *                  'change','create','search','response' 만 허용됨.
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