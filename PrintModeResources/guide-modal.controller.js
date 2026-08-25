'use strict';

app.controller('GuideModalController', function($scope, $uibModalInstance, StorageService) {
    $scope.dontShowAgain = false;

    $scope.closeModal = function() {
        // 「今後は表示しない」にチェックが入っていたら、ストレージにフラグを保存
        if ($scope.dontShowAgain) {
            StorageService.setData('skipAppLaunchGuide', true);
        }
        $uibModalInstance.close();
    };
});