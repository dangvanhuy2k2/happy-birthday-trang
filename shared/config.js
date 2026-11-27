(function () {
  'use strict';

  const config = {
    name: 'Vũ Thị Trang',
    nickname: 'Trang',
    birthDay: 27,
    birthMonth: 11,
    birthYear: 2004,
    timezone: 'Asia/Ho_Chi_Minh',
    timezoneOffsetMinutes: 7 * 60,
    photos: [
      { src: 'images/1.jpg', caption: 'Nụ cười anh thích nhất' },
      { src: 'images/2.jpg', caption: 'Hen piaoliang' },
      { src: 'images/3.jpg', caption: 'Hé hé, đáng yêu quá trời' },
      { src: 'images/4.jpg', caption: 'Hai bạn nhỏ và em bánh kem mập ú 🎂' },
      { src: 'images/5.jpg', caption: 'Ngồi im thôi cũng xinh xỉu 🥺' },
      { src: 'images/6.jpg', caption: 'Bông hoa xinh nhất vườn là em nè 🌸' },
      { src: 'images/7.jpg', caption: 'Công chúa của anh' },
      { src: 'images/8.jpg', caption: 'Em đẹp hơn mọi bông hoa' },
      { src: 'images/9.jpg', caption: 'Bó hồng cho cô gái của anh' },
      { src: 'images/10.jpg', caption: 'Hai đứa mình, mọi chuyến đi' }
    ],
    music: 'music/birthday.mp3',
    letter: `Gửi Trang của anh,

Chúc mừng em tròn 22 tuổi. Anh không giỏi nói lời hoa mỹ, nên anh làm trang web nhỏ này, gom lại những khoảnh khắc của chúng mình.

Cảm ơn em vì đã đến, đã ở lại, đã kiên nhẫn với những lúc anh vụng về. Cảm ơn em vì nụ cười làm anh quên hết mệt mỏi, vì những lần em giận mà vẫn lo anh ăn chưa.

Tuổi 22, anh chúc em luôn khỏe mạnh, bình an, làm điều em thích và được yêu thương thật nhiều, trước hết là bởi chính em, sau đó là bởi anh.

Anh không hứa sẽ cho em mọi thứ, nhưng anh hứa sẽ luôn ở đây, trong mọi sinh nhật sau này của em.

Yêu em, hôm nay và mãi mãi. ❤️`,
    wishes: [
      'Chúc em luôn ngủ ngon và không bao giờ mơ thấy ác mộng.',
      'Chúc em ăn hoài không béo (nhưng béo anh vẫn thương).',
      'Chúc em mọi deadline đều xong sớm.',
      'Chúc em luôn tự tin, vì em xinh hơn em nghĩ nhiều.',
      'Chúc em có anh bên cạnh, mỗi năm, mỗi sinh nhật.',
      'Chúc em được làm công việc em yêu.',
      'Chúc em mỗi sáng thức dậy đều có lý do để cười.',
      'Chúc em những ngày bận rộn vẫn có một khoảng thảnh thơi.',
      'Chúc em đủ can đảm để thử những điều em từng ngại.',
      'Chúc em đi đâu cũng gặp người tử tế.',
      'Chúc em gọi trà sữa lần nào cũng đúng độ ngọt.',
      'Chúc em có nhiều chuyến đi để kể anh nghe.',
      'Chúc em được ôm thật lâu mỗi khi thấy mệt.',
      'Chúc em cùng anh gom thêm nhiều ảnh đẹp, kể cả ảnh anh chụp lệch.',
      'Chúc em luôn có bản nhạc hợp với tâm trạng.',
      'Chúc em đủ thời gian cho những điều mình thích.',
      'Chúc em nhận được tin vui vào một ngày rất đỗi bình thường.',
      'Chúc em có những ngày mưa được ngủ nướng thêm một chút.',
      'Chúc em khi cần tựa vai, anh vừa hay ở cạnh.',
      'Chúc em giữ được sự dịu dàng ngay cả với chính mình.',
      'Chúc em ăn miếng bánh cuối mà chẳng ai giành, kể cả anh.',
      'Chúc tuổi 22 của em đầy bình an và những cái ôm.'
    ],
    timeline: [
      { date: '01/01/2024', title: 'Lần đầu gặp em (sửa sau)', text: 'Ngày hai đứa bắt đầu biết đến nhau.' },
      { date: '14/02/2024', title: 'Buổi hẹn đầu (sửa sau)', text: 'Một buổi đi chơi mà anh vẫn muốn kể lại.' },
      { date: '01/06/2025', title: 'Một chuyến đi cùng nhau (sửa sau)', text: 'Chỗ này dành cho một kỷ niệm của hai đứa.' },
      { date: '27/11/2026', title: 'Sinh nhật tuổi 22 (sửa sau)', text: 'Món quà nhỏ anh dành cho Trang hôm nay.' }
    ]
  };

  const day = 86_400_000;
  const offset = config.timezoneOffsetMinutes * 60_000;

  function birthdayStart(year) {
    return Date.UTC(year, config.birthMonth - 1, config.birthDay) - offset;
  }

  function getBirthdayState(now = Date.now()) {
    const localYear = new Date(now + offset).getUTCFullYear();
    const start = birthdayStart(localYear);
    const birthday = now >= start && now < start + day;
    const passed = now >= start + day;
    const year = localYear + Number(passed);
    const target = birthdayStart(year);
    return {
      mode: birthday ? 'birthday' : 'countdown',
      passed,
      year,
      age: year - config.birthYear,
      target,
      remaining: Math.max(0, target - now)
    };
  }

  function getCountdownParts(remaining) {
    const seconds = Math.max(0, Math.ceil(remaining / 1000));
    return [Math.floor(seconds / 86400), Math.floor(seconds / 3600) % 24,
      Math.floor(seconds / 60) % 60, seconds % 60];
  }

  window.BIRTHDAY_CONFIG = Object.assign(config, { birthdayStart, getBirthdayState, getCountdownParts });
})();
