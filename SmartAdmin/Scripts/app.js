﻿var QuaiderApp = {

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
    }
}
