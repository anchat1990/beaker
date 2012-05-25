ReserveWorkflow = function (arch,distro_family,tag,distro,submit,auto_pick,arch_val,distro_family_val,tag_val,
                            all_arches,all_distro_familys,all_tags) {
    this.arch_id = arch
    this.distro_family_id = distro_family
    this.tag_id = tag
    this.distro_id = distro 
    this.submit_id = submit
    this.auto_pick_id = auto_pick

    this.arch_val = arch_val
    this.distro_family_val = distro_family_val
    this.tag_val = tag_val

    this.all_arches = all_arches
    this.all_distro_familys = all_distro_familys
    this.all_tags = all_tags
    bindMethods(this)
    this.deferred_get_distros = new Deferred();
};

ReserveWorkflow.prototype.set_remotes = function(distro_rpc,system_one_distro_rpc,system_many_distros_rpc,reserve_href) {
    this.get_distros_rpc =  distro_rpc
    this.find_systems_one_distro_rpc = system_one_distro_rpc
    this.find_systems_many_distro_rpc = system_many_distros_rpc
    this.reserve_system_href = reserve_href
    bindMethods(this)
}


ReserveWorkflow.prototype.initialize = function() {  
    getElement(this.submit_id).setAttribute('disabled',1) 
    getElement(this.auto_pick_id).setAttribute('disabled',1)
    this.replace_fields() 
}

ReserveWorkflow.prototype.replace_fields = function() {  
    // For some stupid reason I can't get a closure to work in JS...so I'm writing all this redundant code
    // what a pita
    replaceChildNodes(this.arch_id, map(this.replaceArch ,this.all_arches))
    replaceChildNodes(this.distro_family_id, map(this.replaceDistroFamily ,this.all_distro_familys))
    replaceChildNodes(this.tag_id, map(this.replaceTag ,this.all_tags))
    $("#"+this.tag_id+" option[value='STABLE']").attr('selected', 'selected') //SET default tag as 'STABLE'
}


ReserveWorkflow.prototype.replaceDistroFamily = function(arg) { 
        if ( arg[0] == this.distro_family_val ) {
            option = OPTION({"value": arg[0],
                             "selected": true}, arg[1]);
        } else {
            option = OPTION({"value": arg[0]}, arg[1]);
        }
        return option;
}

ReserveWorkflow.prototype.replaceTag = function(arg) { 
        if ( arg[0] == this.tag_val ) {
            option = OPTION({"value": arg[0],
                             "selected": true}, arg[1]);
        } else {
            option = OPTION({"value": arg[0]}, arg[1]);
        }
        return option;
}

ReserveWorkflow.prototype.replaceArch = function(arg) { 
        if ( arg[0] == this.arch_val ) {
            option = OPTION({"value": arg[0],
                             "selected": true}, arg[1]);
        } else {
            option = OPTION({"value": arg[0]}, arg[1]);
        }
        return option;
}

ReserveWorkflow.prototype.system_available = function(arg) {
    var distro_value = getElement(this.distro_id).value
    var arch_value = jQuery('#'+this.arch_id).val()
    var params = { 'tg_format' : 'json',
                   'tg_random' : new Date().getTime(),
                   'arches' : arch_value }
 
    if (arch_value.length > 1) {
        params['distro_name'] =  distro_value
        var d = loadJSONDoc(this.find_systems_many_distro_rpc + '?' + queryString(params));
    } else {
        params['distro_install_name'] =  distro_value
        var d = loadJSONDoc(this.find_systems_one_distro_rpc + '?' + queryString(params));
    }

    d.addCallback(this.show_auto_pick_warnings)
}

ReserveWorkflow.prototype.show_auto_pick_warnings = function(results) {
    var enough_systems = results['enough_systems']
    //Turn off any existing warnings
    getElement('reserve_error').setAttribute('style', 'display:none')
    getElement('reserve_error_system').setAttribute('style', 'display:none')
    if (!enough_systems) {
         if ('error' in results) {
             var elem = getElement('reserve_error');
             elem.setAttribute('style','display:inline');
             elem.textContent = results['error']
         } else {
             getElement('reserve_error_system').setAttribute('style','display:inline')
         }
    } else {
        var distro_ids = results['distro_id']
        var real_get_args = $.param({'distro_id': distro_ids}, true);
        location.href=this.reserve_system_href + '?' + real_get_args
    }
}


ReserveWorkflow.prototype.get_distros = function() {
    var distro_family_value = getElement(this.distro_family_id).value
    var arch_value = jQuery('#'+this.arch_id).val()
    var tag_value = getElement(this.tag_id).value
    var params = { 'tg_format' : 'json',
                   'tg_random' : new Date().getTime(),
                   'arch' : arch_value,
                   'distro_family' : distro_family_value,
                   'tag' : tag_value }
    this.deferred_get_distros.cancel();
    AjaxLoader.prototype.add_loader(this.distro_id)
    var d = this.deferred_get_distros = loadJSONDoc(this.get_distros_rpc + '?' + queryString(params));
    d.addCallback(this.replaceDistros);
    d.addBoth(this.removeLoader);
};

ReserveWorkflow.prototype.replaceDistros = function(result) {  
    if (result.options.length > 0) {
        var arch_value = jQuery('#'+this.arch_id).val() 
        if (arch_value.length == 1) {
            getElement(this.submit_id).removeAttribute('disabled')
        } else {
            getElement(this.submit_id).setAttribute('disabled',1)
        }
       
        getElement(this.auto_pick_id).removeAttribute('disabled')
    } else {
        result.options.unshift('None selected')
        getElement(this.submit_id).setAttribute('disabled',1)
        getElement(this.auto_pick_id).setAttribute('disabled',1)
    }

    replaceChildNodes(this.distro_id, map(this.replaceOptions, result.options));
}

ReserveWorkflow.prototype.removeLoader = function () {
    AjaxLoader.prototype.remove_loader(this.distro_id);
};

ReserveWorkflow.prototype.replaceOptions = function(arg) {
    option = OPTION({"value": arg}, arg)
    return option
}