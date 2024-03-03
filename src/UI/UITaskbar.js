import UITaskbarItem from './UITaskbarItem.js'
import UIPopover from './UIPopover.js'

async function UITaskbar(options){
    global_element_id++;

    options = options ?? {};
    options.content = options.content ?? '';

    // get launch apps
    $.ajax({
        url: api_origin + "/get-launch-apps",
        type: 'GET',
        async: true,
        contentType: "application/json",
        headers: {
            "Authorization": "Bearer "+auth_token
        },
        success: function (apps){ 
            window.launch_apps = apps;
        }
    });

    let h = '';
    h += `<div id="ui-taskbar_${global_element_id}" class="taskbar" style="height:${window.taskbar_height}px;"><span id='clock'></span></div>`;

    $('.desktop').append(h);

    //---------------------------------------------
    // add `Start` to taskbar
    //---------------------------------------------
    UITaskbarItem({
        icon: window.icons['start.svg'],
        name: 'Start',
        sortable: false,
        keep_in_taskbar: true,
        disable_context_menu: true,
        onClick: async function(item){
            // skip if popover already open
            if($(item).hasClass('has-open-popover'))
                return;

            // show popover
            let popover = UIPopover({
                content: `<div class="launch-popover hide-scrollbar"><span class="close-launch-popover">✕</span></div>`,
                snapToElement: item,
                parent_element: item,
                width: 500,
                height: 500,
                center_horizontally: true,
            });

            // In the rare case that launch_apps is not populated yet, get it from the server
            // then populate the popover
            if(!launch_apps || !launch_apps.recent || launch_apps.recent.length === 0){
                // get launch apps
                launch_apps = await $.ajax({
                    url: api_origin + "/get-launch-apps",
                    type: 'GET',
                    async: true,
                    contentType: "application/json",
                    headers: {
                        "Authorization": "Bearer "+auth_token
                    },
                });
            }
            
            let apps_str = '';

            apps_str += `<div style="margin-bottom: 10px; padding: 5px; position: relative;">`
                apps_str += `<input style="background-image:url(${window.icons['magnifier-outline.svg']});" class="launch-search">`;
                apps_str += `<img class="launch-search-clear" src="${window.icons['close.svg']}">`;
            apps_str += `</div>`;
            // -------------------------------------------
            // Recent apps
            // -------------------------------------------
            if(launch_apps.recent.length > 0){
                // heading
                apps_str += `<h1 class="start-section-heading start-section-heading-recent">Recent</h1>`;

                // apps
                apps_str += `<div class="launch-apps-recent">`;
                for (let index = 0; index < window.launch_recent_apps_count && index < launch_apps.recent.length; index++) {
                    const app_info = launch_apps.recent[index];
                    apps_str += `<div title="${html_encode(app_info.title)}" data-name="${html_encode(app_info.name)}" class="start-app-card">`;
                        apps_str += `<div class="start-app" data-app-name="${html_encode(app_info.name)}" data-app-uuid="${html_encode(app_info.uuid)}" data-app-icon="${html_encode(app_info.icon)}" data-app-title="${html_encode(app_info.title)}">`;
                            apps_str += `<img class="start-app-icon" src="${html_encode(app_info.icon ? app_info.icon : window.icons['app.svg'])}">`;
                            apps_str += `<span class="start-app-title">${html_encode(app_info.title)}</span>`;
                        apps_str += `</div>`;
                    apps_str += `</div>`;
                }
                apps_str += `</div>`;
            }
            // -------------------------------------------
            // Reccomended apps
            // -------------------------------------------
            if(launch_apps.recommended.length > 0){
                // heading
                apps_str += `<h1 class="start-section-heading start-section-heading-recommended" style="${launch_apps.recent.length > 0 ? 'padding-top: 30px;' : ''}">Recommended</h1>`;
                
                // apps
                apps_str += `<div class="launch-apps-recommended">`;
                for (let index = 0; index < launch_apps.recommended.length; index++) {
                    const app_info = launch_apps.recommended[index];
                    apps_str += `<div title="${html_encode(app_info.title)}" data-name="${html_encode(app_info.name)}" class="start-app-card">`;
                        apps_str += `<div class="start-app" data-app-name="${html_encode(app_info.name)}" data-app-uuid="${html_encode(app_info.uuid)}" data-app-icon="${html_encode(app_info.icon)}" data-app-title="${html_encode(app_info.title)}">`;
                            apps_str += `<img class="start-app-icon" src="${html_encode(app_info.icon ? app_info.icon : window.icons['app.svg'])}">`;
                            apps_str += `<span class="start-app-title">${html_encode(app_info.title)}</span>`;
                        apps_str += `</div>`;
                    apps_str += `</div>`;
                }
                apps_str += `</div>`;
            }

            // add apps to popover
            $(popover).find('.launch-popover').append(apps_str);

            // focus on search input only if not on mobile
            if(!isMobile.phone)
                $(popover).find('.launch-search').focus();

            // make apps draggable
            $(popover).find('.start-app').draggable({
                appendTo: "body",
                helper: "clone",
                revert: "invalid",
                connectToSortable: ".taskbar",
                //containment: "document",
                zIndex: parseInt($(popover).css('z-index')) + 1,
                scroll: false,
                distance: 5,
                revertDuration: 100,
                helper: 'clone',
                cursorAt: { left: 18, top: 20 },
                start: function(event, ui){
                },
                drag: function(event, ui){
                },
                stop: function(){
                }
            });
        }
    });            

    //---------------------------------------------
    // add `Explorer` to the taskbar
    //---------------------------------------------
    UITaskbarItem({
        icon: window.icons['folders.svg'],
        app: 'explorer',
        name: 'Explorer',
        sortable: false,
        keep_in_taskbar: true,
        lock_keep_in_taskbar: true,
        onClick: function(){
            let open_window_count = parseInt($(`.taskbar-item[data-app="explorer"]`).attr('data-open-windows'));
            if(open_window_count === 0){
                launch_app({ name: 'explorer', path: window.home_path});
            }else{
                return false;
            }
        }
    })

    //---------------------------------------------
    // Add other useful apps to the taskbar
    //---------------------------------------------
    if(window.user.taskbar_items && window.user.taskbar_items.length > 0){
        for (let index = 0; index < window.user.taskbar_items.length; index++) {
            const app_info = window.user.taskbar_items[index];
            // add taskbar item for each app
            UITaskbarItem({
                icon: app_info.icon,
                app: app_info.name,
                name: app_info.title,
                keep_in_taskbar: true,
                onClick: function(){
                    let open_window_count = parseInt($(`.taskbar-item[data-app="${app_info.name}"]`).attr('data-open-windows'));
                    if(open_window_count === 0){
                        launch_app({
                            name: app_info.name,
                        }) 
                    }else{
                        return false;
                    }
                }
            });
        }
    }

    //---------------------------------------------
    // add `Trash` to the taskbar
    //---------------------------------------------
    const trash = await puter.fs.stat(trash_path);
    if(window.socket){
        window.socket.emit('trash.is_empty', {is_empty: trash.is_empty});
    }

    UITaskbarItem({
        icon: trash.is_empty ? window.icons['trash.svg'] : window.icons['trash-full.svg'],
        app: 'trash',
        name: 'Trash',
        sortable: false,
        keep_in_taskbar: true,
        lock_keep_in_taskbar: true,
        onClick: function(){
            let open_windows = $(`.window[data-path="${html_encode(trash_path)}"]`);
            if(open_windows.length === 0){
                launch_app({ name: 'explorer', path: window.trash_path});
            }else{
                open_windows.focusWindow();
            }
        },
        onItemsDrop: function(items){
            move_items(items, trash_path);
        }
    })

    make_taskbar_sortable();
}

window.make_taskbar_sortable = function(){
    //-------------------------------------------
    // Taskbar is sortable
    //-------------------------------------------
    $('.taskbar').sortable({
        axis: "x",
        items: '.taskbar-item-sortable:not(.has-open-contextmenu)',
        cancel: '.has-open-contextmenu',
        placeholder: "taskbar-item-sortable-placeholder",
        helper : 'clone',
        distance: 5,
        revert: 10,
        receive: function(event, ui){
            if(!$(ui.item).hasClass('taskbar-item')){
                // if app is already in taskbar, cancel
                if($(`.taskbar-item[data-app="${$(ui.item).attr('data-app-name')}"]`).length !== 0){
                    $(this).sortable('cancel');
                    $('.taskbar .start-app').remove();
                    return;
                }else{
                }
            }
        },
        update: function(event, ui){
            if(!$(ui.item).hasClass('taskbar-item')){
                // if app is already in taskbar, cancel
                if($(`.taskbar-item[data-app="${$(ui.item).attr('data-app-name')}"]`).length !== 0){
                    $(this).sortable('cancel');
                    $('.taskbar .start-app').remove();
                    return;
                }
                
                let item = UITaskbarItem({
                    icon: $(ui.item).attr('data-app-icon'),
                    app: $(ui.item).attr('data-app-name'),
                    name: $(ui.item).attr('data-app-title'),
                    append_to_taskbar: false,
                    keep_in_taskbar: true,
                    onClick: function(){
                        let open_window_count = parseInt($(`.taskbar-item[data-app="${$(ui.item).attr('data-app-name')}"]`).attr('data-open-windows'));
                        if(open_window_count === 0){
                            launch_app({
                                name: $(ui.item).attr('data-app-name'),
                            }) 
                        }else{
                            return false;
                        }
                    }
                });
                let el = ($(item).detach())
                $(el).insertAfter(ui.item);
                // $(ui.item).insertBefore(`<h1>Hello!</h1>`);
                $(el).show();
                $(ui.item).removeItems();  
                update_taskbar();  
            }
            // only proceed to update DB if the item sorted was a pinned item otherwise no point in updating the taskbar in DB
            else if($(ui.item).attr('data-keep-in-taskbar') === 'true'){
                update_taskbar();
            }
        },
    });
}

export default UITaskbar;