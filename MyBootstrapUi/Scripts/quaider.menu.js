(function ($) {

    $.fn.extend({
        smartMenu: function () {
            this.each(function () {
                var me = $(this);

                //激活的一级菜单(有子菜单)，使其具有subdrop样式
                me.find("li.has-sub.active").addClass("subdrop");

                //如果子菜单处于激活状态，那么父级菜单也应该处于激活状态
                me.find("li.active").each(function (i, activeMenu) {
                    activeParentToTop($(activeMenu));
                });

                me.find("li > a").bind("click", function () {
                    var hasChildren = $(this).siblings("ul").find("li").length > 0;
                    if (!hasChildren) {
                        //点击具体菜单的操作逻辑，如跳转等

                        //1.0 取消其他所有菜单的激活状态
                        me.find("li.active").removeClass("active");

                        //1.1 激活自身
                        $(this).parent("li").addClass("active");
                        activeParentToTop($(this).parent("li"));

                        //1.2 关闭其他一级菜单的打开状态
                        //var parentMenu = $(this).parent("li").parent("ul").parent("li");
                        //me.find(" > ul > li.subdrop").not(parentMenu).removeClass("subdrop").find(" > ul").slideUp(200);

                        //1.3 打开页面

                        return;
                    }

                    //点击含有子菜单的菜单操作逻辑，如展开收缩等
                    if ($(this).parent("li").hasClass("subdrop")) {
                        $(this)
                            .parent("li")
                            .find(" > ul")
                            .slideUp(200)
                            .end()
                            .removeClass("subdrop")
                            .siblings("li.subdrop")
                            .find(" > ul")
                            .slideUp(200)
                            .end()
                            .removeClass("subdrop");
                    } else {
                        $(this)
                            .parent("li")
                            .find(" > ul")
                            .slideDown(300)
                            .end()
                            .addClass("subdrop")
                            .siblings("li.subdrop")
                            .find(" > ul")
                            .slideUp(200)
                            .end()
                            .removeClass("subdrop");
                    }

                });

            });

            function activeParentToTop(menu) {
                if (!menu || menu.length <= 0) return;
                var parent = menu.parent("ul").parent("li");
                if (parent.length <= 0) return;
                parent.addClass("active subdrop");
                //逐个向上递归
                activeParentToTop(parent);
            }
        }
    });

})(jQuery);