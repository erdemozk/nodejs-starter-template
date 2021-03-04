const bcrypt = require('bcryptjs');
const { User } = require('../../../../models');
const { userValidator } = require('../../../validators');
const { errorHelper, logger, getText } = require('../../../../utils');

module.exports = async (req, res) => {
    const { error } = userValidator.changePassword(req.body);
    if (error) return res.status(400).json(errorHelper('00069', req, error.details[0].message));

    if (req.body.oldPassword === req.body.newPassword) return res.status(400).json(errorHelper('00073', req));

    const user = await User.findById(req.user._id).select('password')
        .catch((err) => {
            return res.status(500).json(errorHelper('00070', req, err.message));
        });

    const match = await bcrypt.compare(req.body.oldPassword, user.password)
        .catch((err) => {
            return res.status(500).json(errorHelper('00071', req, err.message));
        });

    if (!match) return res.status(400).json(errorHelper('00072', req));

    const hash = await bcrypt.hash(req.body.newPassword, 10)
        .catch((err) => {
            return res.status(500).json(errorHelper('00074', req, err.message));
        });

    user.password = hash;

    await user.save().catch((err) => {
        return res.status(500).json(errorHelper('00075', req, err.message));
    });

    logger('00076', req.user._id, getText('en', '00076'), 'Info', req);
    return res.status(200).json({
        resultMessage: { en: getText('en', '00076'), tr: getText('tr', '00076') },
        resultCode: '00076'
    });
};

/**
 * @swagger
 * /user/change-password:
 *    post:
 *      summary: Changes the Password
 *      parameters:
 *        - in: header
 *          name: Authorization
 *          schema:
 *            type: string
 *          description: Put access token here
 *      requestBody:
 *        description: Old and new passwords
 *        required: true
 *        content:
 *          application/json:
 *            schema:
 *              type: object
 *              properties:
 *                oldPassword:
 *                  type: string
 *                newPassword:
 *                  type: string
 *      tags:
 *        - User
 *      responses:
 *        "200":
 *          description: Your password is changed successfully.
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/Result'
 *        "400":
 *          description: Please provide old and new passwords that are longer than 6 letters and shorter than 20 letters.
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/Result'
 *        "401":
 *          description: Invalid token.
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/Result'
 *        "500":
 *          description: An internal server error occurred, please try again.
 *          content:
 *              application/json:
 *                  schema:
 *                      $ref: '#/components/schemas/Result'
 */