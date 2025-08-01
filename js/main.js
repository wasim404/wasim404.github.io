// ==================================================
// Project Name  :  Madrasha
// File          :  JS Base
// Version       :  1.0.0  
// Author        :  Bitspeck
// Developer:    :  MD.ABDULLAH FAHAD GAZI
// ==================================================


$(document).ready(function() {

// preloader - start

  $(window).on('load', function () {
    $('#preloader').fadeOut('slow', function () { $(this).remove(); });
  });
  setTimeout(function()
  { $('#preloader').addClass('d-none'); }, 3000);
  
// preloader - end

var headerId = $(".sticky-header");
  var headerTop = $(".sticky-header .header_top_area");

  // preloader - end
  $('.multiple-items').slick({
    infinite: true,
    slidesToShow: 3,
    slidesToScroll: 3
  });

// course slider
  var owl = $("#owl-demo1");

  owl.owlCarousel({
      autoplay: true,
      items: 3, //10 items above 1000px browser width
      responsive:{
        0:{
            items:1
        },
        600:{
            items:1
        },
        800:{
          items:2
        },
        1000:{
            items:2
        },
        1200:{
          items:3
      }
    }
      
  });

  // Custom Navigation Events
  $(".next").click(function() {
      owl.trigger('owl.next');
  })
  $(".prev").click(function() {
      owl.trigger('owl.prev');
  })
  $(".play").click(function() {
      owl.trigger('owl.play', 1000);
  })
  $(".stop").click(function() {
      owl.trigger('owl.stop');
  })

  // testimonial

  // categories- meta

    $('.slide').slick({
    infinite: true,
    slidesToShow: 3,
    slidesToScroll: 3,
    dots:false,
    autoplay:true,
    });
 
    // .client - start
  $('.offer-crousel').owlCarousel({
    loop:true,
    speed:30,
    margin:10,
    nav:true,
    autoplay:true,
    responsive:{
        0:{
          items:1
        },
        600:{
          items:1
        },
        1000:{
          items:3
        }
      }
    })

    $('.client').owlCarousel({
    loop:false,
    margin:10,
    nav:true,
    dots:false,
    autoplay:true,
    autoplayTimeout:5000,
    responsive:{
        0:{
            items:1
        },
        500:{
            items:1
        },
        600:{
            items:2
        },
        1000:{
            items:5
        }
      }
    })

     // .client - end

    $('.clientsay2').owlCarousel({
    loop:false,
    margin:10,
    nav:false,
    dots : true,
    autoplay:true,
    autoplayTimeout:3000,
    responsive:{
        0:{
            items:1
        },
        600:{
            items:1
        },
        1000:{
            items:1
        }
      }
    })


    $('.banner').owlCarousel({
      loop:true,
      margin:10,
      nav:false,
      dots:false,
      autoplay:true,
      autoplayTimeout:5000,
      responsive:{
        0:{
          items:1
        },
        600:{
          items:1
        },
        1000:{
          items:1
        }
      }
    })


// count js - start


  $(document).ready(function() {

    var counters = $(".counter");
    var countersQuantity = counters.length;
    var counter = [];

    for (i = 0; i < countersQuantity; i++) {
      counter[i] = parseInt(counters[i].innerHTML);
    }

    var count = function(start, value, id) {
      var localStart = start;
      setInterval(function() {
        if (localStart < value) {
          localStart++;
          counters[id].innerHTML = localStart;
        }
      }, 40);
    }

    for (j = 0; j < countersQuantity; j++) {
      count(0, counter[j], j);
    }
  });


//-----------------------------------------------
 // top-to-back - start 
 // ----------------------------------------------
  if ($(window).scrollTop() < 100) {
    $('.scrollToTop').hide();
  }
  
  $(window).scroll(function() {
    console.log($(this).scrollTop() );
    if ($(this).scrollTop() > 100) {
      $('.scrollToTop').fadeIn('slow');
    } else {
      $('.scrollToTop').fadeOut('slow');
    }
  });
  $('.scrollToTop').click(function(){
    $('html, body').stop().animate({scrollTop:0}, 500, 'swing');
    return false;
  });
  

// -----------------------------------------------
 // top-to-back - start 
 // ----------------------------------------------

  $('#contact_form .from-button').click(function () {
    $.ajax({
        type: 'post',
        url: 'mail.php',
        data: $('#contact_form').serialize(),
        success: function () {
          $('#contact_form')[0].reset();
          $('#contact_form .from-button').attr('style', "background-color:#16C39A");
          $('#contact_form .from-button').siblings().html("<i style='color:#16C39A'>*</i> Email has been sent successfully");
        }
    });
    return false;
  });

// This is wow js

  new WOW().init();


//Courses section


//___faQ QUESTION___//

  $(function(){
    $("div[data-toggle=collapse]").click(function(){
        $(this).children('span').toggleClass("fa-chevron-down fa-chevron-up");
    });
  })


//gallery//

    $(".filter-button").click(function(){
        var value = $(this).attr('data-filter');
        
        if(value == "all")
        {
          $('.filter').show('1000');
        }
        else
        {
          $(".filter").not('.'+value).hide('3000');
          $('.filter').filter('.'+value).show('3000'); 
        }
    });
    
    if ($(".filter-button").removeClass("active")) {
    $(this).removeClass("active");
    
    $(this).addClass("active");
    }


  

    // video


});


