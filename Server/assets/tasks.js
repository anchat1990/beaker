// This program is free software; you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation; either version 2 of the License, or
// (at your option) any later version.


;(function() {

window.TaskView = Backbone.View.extend({
    template: JST['task'],
    events: {
        'click .disable': 'disable',
    },
    initialize: function() {
        this.render();
        this.listenTo(this.model, 'change', this.render);
    },
    render: function() {
        this.$el.html(this.template(this.model.attributes));
    },
    disable: function(evt) {
        var model = this.model, $dis_btn = this.$('button.disable');
        if (!$dis_btn.attr('disabled')) {
            bootbox.confirm_as_promise('<p>Are you sure you want to disable this task?</p>')
                .fail(function () {$dis_btn.button('reset');})
                .then(function () { return model.save({disabled: true}, {patch: true});})
                .fail(_.bind(this.disable_error, this));
        }
    },
    disable_error: function(xhr) {
        if(!_.isEmpty(xhr)) {
            growl_for_xhr(xhr, 'Failed to disable');
            this.$('button.disable').button('reset');
        }
    },
});


})();
