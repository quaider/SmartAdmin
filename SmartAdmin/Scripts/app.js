var QuaiderApp = {

    /**
     * 初始化应用程序
     */
    start: function () {

        $('.slimscrollleft').slimScroll({
            height: 'auto',
            position: 'right',
            size: "5px",
            color: '#000',
            opacity: .4,
            wheelStep: 5
        });

        $("#sidebar-menu").smartMenu();

        /* Set the defaults for DataTables initialisation */
        $.extend(true, $.fn.dataTable.defaults, {
            dom:
                "<'row'<'col-sm-6'l><'col-sm-6 text-right'B>>" +
                "<'row'<'col-sm-12'tr>>" +
                "<'row'<'col-sm-5'i><'col-sm-7'p>>",
            renderer: 'bootstrap',
            language: {
                "url": "Scripts/i18n/datatable.lang.chinese.json"
            }
        });
    }
}


