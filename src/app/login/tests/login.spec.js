describe('Component: Login', function() {
    var scope,
        q,
        loginFactory,
        oc,
        credentials = {
            Username: 'notarealusername',
            Password: 'notarealpassword'
        };
    beforeEach(module('orderCloud'));
    beforeEach(module('orderCloud.sdk'));
    beforeEach(inject(function($q, $rootScope, OrderCloudSDK, LoginService) {
        q = $q;
        scope = $rootScope.$new();
        loginFactory = LoginService;
        oc = OrderCloudSDK;
    }));

    describe('Factory: LoginService', function() {
        var client_id;
        beforeEach(inject(function(clientid) {
            client_id = clientid;
        }));
        describe('SendVerificationCode', function() {
            var passwordResetRequest;
            beforeEach(inject(function($window) {
                var email = 'test@test.com';
                passwordResetRequest = {
                    Email: email,
                    ClientID: client_id,
                    URL: encodeURIComponent($window.location.href) + '{0}'
                };
                var deferred = q.defer();
                deferred.resolve(true);
                spyOn(oc.PasswordResets, 'SendVerificationCode').and.returnValue(deferred.promise);
                loginFactory.SendVerificationCode(email);
            }));
            it ('should call the SendVerificationCode method of PasswordResets with the reset request object', function(){
                expect(oc.PasswordResets.SendVerificationCode).toHaveBeenCalledWith(passwordResetRequest);
            });
        });

        describe('Logout', function() {
            var cookies,
                state;
            beforeEach(inject(function($cookies, $state) {
                var cookieResponse = {
                    'a':'1',
                    'b':'2'
                };
                cookies = $cookies;
                state = $state;
                var dfd = q.defer();
                dfd.resolve();
                spyOn(cookies, 'getAll').and.returnValue(cookieResponse);
                spyOn(cookies, 'remove').and.callThrough();
                spyOn(state, 'go').and.returnValue(dfd.promise);
            }));

            it('should remove all of the cookies', function() {
                loginFactory.Logout();
                expect(cookies.getAll).toHaveBeenCalled();
                expect(cookies.remove).toHaveBeenCalledWith('a');
                expect(cookies.remove).toHaveBeenCalledWith('b');
            });

            it('should redirect to home/login state', function() {
                loginFactory.Logout();
                expect(state.go).toHaveBeenCalled();
            })
        });

        describe('ResetPassword', function() {
            var creds = {
                ResetUsername: credentials.Username,
                NewPassword: credentials.Password,
                ConfirmPassword: credentials.Password
            };
            beforeEach(inject(function() {
                var deferred = q.defer();
                deferred.resolve(true);
                spyOn(oc.PasswordResets, 'ResetPassword').and.returnValue(deferred.promise);
                loginFactory.ResetPassword(creds, 'code');
            }));
            it ('should call the ResetPassword method of the PasswordResets Service with a code and credentials', function() {
                expect(oc.PasswordResets.ResetPassword).toHaveBeenCalledWith('code', {ClientID: client_id, Username: creds.ResetUsername, Password: creds.NewPassword});
            });
        });

        describe('RememberMe', function(){
            beforeEach(function(){
                var deferred = q.defer();
                deferred.resolve({access_token:'ACCESS_TOKEN'});
                spyOn(oc.Refresh, 'GetToken').and.returnValue(deferred.promise);

                var dfd = q.defer();
                dfd.resolve();
                spyOn(oc.BuyerID, 'Set').and.returnValue(dfd.promise);
                spyOn(oc.Auth, 'SetToken').and.returnValue(dfd.promise);

            });

            it('should find the refresh token, refresh the access token, and store the new access token in cookies', function(){
                spyOn(oc.Refresh, 'ReadToken').and.returnValue('REFRESH_TOKEN');
                loginFactory.RememberMe();

                expect(oc.Refresh.ReadToken).toHaveBeenCalled();
                expect(oc.Refresh.GetToken).toHaveBeenCalledWith('REFRESH_TOKEN');
                scope.$digest();
                expect(oc.BuyerID.Set).toHaveBeenCalled();
                expect(oc.Auth.SetToken).toHaveBeenCalledWith('ACCESS_TOKEN');
            });

            it('should not attempt to refresh users who do not have a refresh token', function() {
                spyOn(oc.Refresh, 'ReadToken').and.returnValue(null);
                loginFactory.RememberMe();
                expect(oc.Refresh.ReadToken).toHaveBeenCalled();
                expect(oc.Refresh.GetToken).not.toHaveBeenCalled();
            })

        });
    });

    describe('Controller: LoginCtrl', function() {
        var loginCtrl,
            fakeToken = 'XXXX-XXXX-XXXX';
        beforeEach(inject(function($controller, $state) {
            spyOn($state, 'go').and.returnValue(true);
            var dfd = q.defer();
            dfd.resolve({access_token: fakeToken});
            spyOn(oc.Auth, 'GetToken').and.returnValue(dfd.promise);
            spyOn(oc.Auth, 'SetToken').and.returnValue(dfd.promise);
            loginCtrl = $controller('LoginCtrl', {
                $scope: scope,
                LoginService: loginFactory,
                oc: oc
            });
        }));

        describe('form', function() {
            it ('should initialize to login', function() {
                expect(loginCtrl.form).toBe('login');
            });
        });

        describe('setForm', function() {
            it ('should change the value of form to the passed in value', function() {
                loginCtrl.setForm('reset');
                expect(loginCtrl.form).toBe('reset');
            });
        });

        describe('submit', function() {
            beforeEach(function() {
                loginCtrl.credentials = credentials;
                loginCtrl.submit();
                scope.$digest();
            });
            it ('should call the GetToken method from the Auth Service with credentials', function() {
                expect(oc.Auth.GetToken).toHaveBeenCalledWith(credentials);
            });
            it ('should call the SetToken method from the Auth Service', function() {
                expect(oc.Auth.SetToken).toHaveBeenCalledWith(fakeToken);
            });
            it ('should enter the home state', inject(function($state) {
                expect($state.go).toHaveBeenCalledWith('home');
            }));
        });

        describe('forgotPassword', function() {
            var email = 'test@test.com';
            beforeEach(function() {
                loginCtrl.credentials = {
                    Email: email
                };
                var deferred = q.defer();
                deferred.resolve(true);
                spyOn(loginFactory, 'SendVerificationCode').and.returnValue(deferred.promise);
                loginCtrl.forgotPassword();
                scope.$digest();
            });
            it ('should call the LoginService SendVerificationCode with the email', function() {
                expect(loginFactory.SendVerificationCode).toHaveBeenCalledWith(email);
            });
            it ('should set the form to verificationCodeSuccess', function() {
                expect(loginCtrl.form).toBe('verificationCodeSuccess');
            });
            it ('should set credentials.Email back to null', function() {
                expect(loginCtrl.credentials.Email).toBe(null);
            });
        });

        describe('resetPassword', function() {
            var creds = {
                ResetUsername: credentials.Username,
                NewPassword: credentials.Password,
                ConfirmPassword: credentials.Password
            };
            var token = 'reset';
            beforeEach(function() {
                loginCtrl.credentials = creds;
                loginCtrl.token = token;
                var deferred = q.defer();
                deferred.resolve(true);
                spyOn(loginFactory, 'ResetPassword').and.returnValue(deferred.promise);
                loginCtrl.resetPassword();
                scope.$digest();
            });
            it ('should call the ResetPassword method of the LoginService with credentials and token', function() {
                expect(loginFactory.ResetPassword).toHaveBeenCalledWith(creds, token);
            });
            it ('should set the form to resetSuccess', function() {
                expect(loginCtrl.form).toBe('resetSuccess');
            });
            it ('should set the token to null', function() {
                expect(loginCtrl.token).toBe(null);
            });
            it ('should set the credentials values to null', function() {
                for (key in loginCtrl.credentials) {
                    if (loginCtrl.credentials.hasOwnProperty(key)) {
                        expect(loginCtrl.credentials[key]).toBe(null);
                    }
                }
            });
        });
    });
});
