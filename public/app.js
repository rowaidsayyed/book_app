$(document).ready(function () {
  $('#update_form').hide();
  $('#nav-icon3').click(function () {
    $(this).toggleClass('open');
    $('.header-fill').toggleClass('hidden');
    $('.nav-bar').toggleClass('hidden');
  });

  $('#updateBtn').on('click',function(){
    $('#update_form').toggle();
  });

});

