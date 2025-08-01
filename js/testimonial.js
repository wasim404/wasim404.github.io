 jQuery(document).ready(function($) {

    var carousel = $(".clientsay2"); // Activator Class
    carousel.owlCarousel({
        nav : false,
        dots : false,
        loop : true,
        items : 3,
        center:true,
        autoplay:true,
        autoplayHoverPause:true,
        autoplayTimeout:3000,
        // responsive:{
        // 0:{
        //     items:3
        // },
        // 600:{
        //     items:3
        // },
        // 1000:{
        //     items:3
        // }

        // }

    });

    checkClasses();
    carousel.on('translated.owl.carousel', function(event) {
        checkClasses();
    });

    function checkClasses(){
        var total = $('.clientsay2 .owl-stage .owl-item.active').length;

        $('.clientsay2 .owl-stage .owl-item').removeClass('firstActiveItem lastActiveItem');

        $('.clientsay2 .owl-stage .owl-item.active').each(function(index){
            if (index === 0) {
                // this is the first one
                $(this).addClass('firstActiveItem');
            }
            if (index === total - 1 && total>0) {
                // this is the last one
                $(this).addClass('lastActiveItem');
            }
        });
    }


});
