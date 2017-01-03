using System.Web;
using System.Web.Optimization;

namespace SmartAdmin
{
    public class BundleConfig
    {
        // 有关绑定的详细信息，请访问 http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.Add(new ScriptBundle("~/bundles/jquery").Include(
                        "~/Scripts/jquery-{version}.js"));

            bundles.Add(new ScriptBundle("~/bundles/jqueryval").Include(
                        "~/Scripts/jquery.validate*"));

            // 使用要用于开发和学习的 Modernizr 的开发版本。然后，当你做好
            // 生产准备时，请使用 http://modernizr.com 上的生成工具来仅选择所需的测试。
            bundles.Add(new ScriptBundle("~/bundles/modernizr").Include(
                        "~/Scripts/modernizr-*"));

            bundles.Add(new ScriptBundle("~/bundles/bootstrap").Include(
                      "~/Scripts/bootstrap.js",
                      "~/Scripts/jquery.slimscroll.js",
                      "~/Scripts/respond.js"));

            bundles.Add(new ScriptBundle("~/bundles/datatable").Include(
                      "~/Content/DataTables/js/jquery.dataTables.js",
                      "~/Content/DataTables/js/dataTables.bootstrap.js",
                      "~/Content/DataTables/js/dataTables.buttons.js",
                      "~/Content/DataTables/js/dataTables.responsive.js",

                      "~/Content/DataTables/js/buttons.bootstrap.js",
                      "~/Content/DataTables/js/buttons.bootstrap.js",
                      "~/Content/DataTables/js/buttons.colVis.js",
                      "~/Scripts/datatable.pagination.input.js"
                      ));

            bundles.Add(new ScriptBundle("~/bundles/components").Include(
                      //"~/Scripts/pace.js",
                      "~/Content/select2/select2.js",
                      "~/Content/layer/layer.js",
                      "~/Content/star-rating/js/star-rating.js",
                      "~/Content/star-rating/themes/krajee-fa/theme.js",
                      "~/Content/zTree_v3/js/jquery.ztree.core.js",
                      "~/Content/zTree_v3/js/jquery.ztree.excheck.js",
                      "~/Content/zTree_v3/js/jquery.ztree.exedit.js",
                      "~/Content/Highchart/highcharts.js"
                      ));

            bundles.Add(new StyleBundle("~/Content/css").Include(
                      "~/Content/bootstrap.css",
                      "~/Content/font-awesome.css",
                      "~/Content/select2/css/select2.css",
                      "~/Content/DataTables/css/dataTables.bootstrap.css",
                      "~/Content/DataTables/css/buttons.bootstrap.css",
                      "~/Content/DataTables/css/responsive.bootstrap.css",
                      //"~/Content/zTree_v3/css/metroStyle/metroStyle.css",
                      "~/Content/zTree_v3/css/awesomeStyle/awesome.css",
                      "~/Content/zTree_v3/css/awesomeStyle/awesome.fixed.css",
                      //"~/Content/themes/dark/theme.css",
                      "~/Content/site.css"));
        }
    }
}
