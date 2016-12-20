using System.ComponentModel.DataAnnotations;

namespace SmartAdmin.Models
{
    /// <summary>
    /// MVC model validations
    /// </summary>
    public class User
    {
        [Required(ErrorMessage = "This value is required.")]
        public string UserName { get; set; }

        [Required(ErrorMessage = "This value is required.")]
        [RegularExpression(@"^[a-z]([a-z0-9]*[-_]?[a-z0-9]+)*@([a-z0-9]*[-_]?[a-z0-9]+)+[\.][a-z]{2,3}([\.][a-z]{2})?$", ErrorMessage = "This value should be a valid email.")]
        //[DataType(DataType.EmailAddress, ErrorMessage = "This value should be a valid email.")]
        public string EmailAddress { get; set; }

        [Required(ErrorMessage = "This value is required.")]
        public string Password { get; set; }

        [Required(ErrorMessage = "This value should be the same.")]
        [Compare("Password", ErrorMessage = "This value should be the same.")]
        public string ComfirmPassword { get; set; }

        [MaxLength(10, ErrorMessage = "Less than 10 words.")]
        public string MaxLength { get; set; }

        [MinLength(5, ErrorMessage = "More than 5 words.")]
        public string MinLength { get; set; }

        [StringLength(10, MinimumLength = 5, ErrorMessage = "This value length is invalid. It should be between {2} and {1} characters long.")]
        public string RangeLength { get; set; }

        [Required(ErrorMessage = "This value is required.")]
        public string Remark { get; set; }

        [Required(ErrorMessage = "You must select at least 1 items.")]
        public int? MinCheck { get; set; }

        [Range(5, 999, ErrorMessage = "This value should be between 5 and 999.")]
        [RegularExpression(@"^[0-9]*$", ErrorMessage = "This value should be a number.")]
        public int? RangeValue { get; set; }
    }
}