using System.ComponentModel.DataAnnotations;

namespace SmartAdmin.Models
{
    public class User
    {
        [Required(ErrorMessage = "This value is required.")]
        public string UserName { get; set; }

        [Required(ErrorMessage = "This value is required.")]
        [RegularExpression(@"^[a-z]([a-z0-9]*[-_]?[a-z0-9]+)*@([a-z0-9]*[-_]?[a-z0-9]+)+[\.][a-z]{2,3}([\.][a-z]{2})?$", ErrorMessage = "This value should be a valid email.")]
        //[DataType(DataType.EmailAddress, ErrorMessage = "This value should be a valid email.")]
        public string EmailAddress { get; set; }
    }
}