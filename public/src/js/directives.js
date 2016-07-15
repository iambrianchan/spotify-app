angular.module('directives', [])
.directive('consoleAnimation', function() {
	return {
		restrict: 'E',
		replace: true,
		template: '<div class="console"></div>',
		link: function(scope, element, attributes) {
			var intro = ">> ";
			scope.$watch('progress.initialMessage', function onChange(newValue, oldValue) {
				if (newValue !== undefined) {
					newValue = intro + newValue;
					var newElement = angular.element("<p></p>").attr('id', 'initialmessage').addClass('message').addClass('step');
					element.append(newElement);
					var message = [];
					for (let i = 0; i < newValue.split('').length + 1; i++) {
						message.push(newValue.substr(0, i));
					}

					for (let i = 0; i < message.length; i++) {
						setTimeout(function() {
							$('#initialmessage').text(message[i]);							
						}, i*10)
					}
				}
			})
			scope.$watch('progress.artistCountMessage', function onChange(newValue, oldValue) {
				if (newValue !== undefined) {
					newValue = intro + newValue;
					var newElement = angular.element("<p></p>").attr('id', 'artistCountMessage').addClass('message').addClass('step');
					element.append(newElement);
					var message = [];
					for (let i = 0; i < newValue.split('').length + 1; i++) {
						message.push(newValue.substr(0, i));
					}

					for (let i = 0; i < message.length; i++) {
						setTimeout(function() {
							$('#artistCountMessage').text(message[i]);							
						}, i*10)
					}
				}
			})	
			scope.$watch('progress.playlistCountMessage', function onChange(newValue, oldValue) {
				if (newValue !== undefined) {
					newValue = intro + newValue;
					var newElement = angular.element("<p></p>").attr('id', 'playlistCountMessage').addClass('message').addClass('step');
					element.append(newElement);
					var message = [];
					for (let i = 0; i < newValue.split('').length + 1; i++) {
						message.push(newValue.substr(0, i));
					}

					for (let i = 0; i < message.length; i++) {
						setTimeout(function() {
							$('#playlistCountMessage').text(message[i]);							
						}, i*10)
					}
				}
			})
			scope.$watch('progress.completionMessage', function onChange(newValue, oldValue) {
				if (newValue !== undefined) {
					newValue = intro + newValue;
					var newElement = angular.element("<p></p>").attr('id', 'completionMessage').addClass('message');
					element.append(newElement);
					var message = [];
					for (let i = 0; i < newValue.split('').length + 1; i++) {
						message.push(newValue.substr(0, i));
					}

					for (let i = 0; i < message.length; i++) {
						setTimeout(function() {
							$('#completionMessage').text(message[i]);							
						}, i*10)
					}
				}
			})
		}
	}
});