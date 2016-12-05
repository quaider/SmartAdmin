using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace MyBootstrapUi.Controllers
{
    public class HomeController : Controller
    {
        /// <summary>
        /// 模仿网络环境
        /// </summary>
        /// <param name="filterContext"></param>
        protected override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            System.Threading.Thread.Sleep(500);
            base.OnActionExecuting(filterContext);
        }

        public ActionResult Index()
        {
            return View();
        }

        public ActionResult Panels()
        {
            return PartialView();
        }

        public ActionResult Designer()
        {
            return PartialView();
        }

        public ActionResult Tabs()
        {
            return PartialView();
        }

        public ActionResult Buttons()
        {
            return PartialView();
        }

        public ActionResult Modals()
        {
            return PartialView();
        }
    }
}